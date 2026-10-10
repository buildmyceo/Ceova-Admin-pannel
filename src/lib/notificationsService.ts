import { AppNotification, Profile, NotificationAttachment, UserRole } from '../types';
import { dispatchNotificationEmails } from './emailService';
import { getSupabaseClient } from './supabase';

const NOTIFICATIONS_STORAGE_KEY = 'ceova_notifications_v2';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapDbRowToNotification(row: any): AppNotification {
  return {
    id: row.id,
    user_id: row.user_id || (row.target_type === 'all' ? 'all' : (Array.isArray(row.recipient_ids) && row.recipient_ids.length === 1 ? row.recipient_ids[0] : null)),
    title: row.title || '',
    message: row.message || '',
    type: row.type || 'message',
    link: row.link || undefined,
    read: Boolean(row.read),
    read_by_ids: Array.isArray(row.read_by_ids) ? row.read_by_ids : [],
    read_by_names: Array.isArray(row.read_by_names) ? row.read_by_names : [],
    created_at: row.created_at || new Date().toISOString(),
    meeting_id: row.meeting_id || undefined,
    task_id: row.task_id || undefined,
    sender_id: row.sender_id || undefined,
    sender_name: row.sender_name || undefined,
    sender_role: row.sender_role || undefined,
    sender_avatar: row.sender_avatar || undefined,
    target_type: row.target_type || (row.user_id === 'all' ? 'all' : 'members'),
    recipient_ids: Array.isArray(row.recipient_ids) ? row.recipient_ids : [],
    recipient_names: Array.isArray(row.recipient_names) ? row.recipient_names : [],
    photos: Array.isArray(row.photos) ? row.photos : undefined,
    files: Array.isArray(row.files) ? row.files : undefined,
    meta: row.meta || undefined
  };
}

function mapNotificationToDbRow(notif: Partial<AppNotification>) {
  return {
    ...(notif.id ? { id: notif.id } : {}),
    title: notif.title || '',
    message: notif.message || '',
    type: notif.type || 'message',
    link: notif.link || null,
    user_id: notif.user_id || null,
    target_type: notif.target_type || 'members',
    sender_id: notif.sender_id || null,
    sender_name: notif.sender_name || null,
    sender_role: notif.sender_role || null,
    sender_avatar: notif.sender_avatar || null,
    recipient_ids: notif.recipient_ids || [],
    recipient_names: notif.recipient_names || [],
    photos: notif.photos || [],
    files: notif.files || [],
    read: Boolean(notif.read),
    read_by_ids: notif.read_by_ids || [],
    read_by_names: notif.read_by_names || [],
    meeting_id: notif.meeting_id || null,
    task_id: notif.task_id || null,
    meta: notif.meta || {}
  };
}

export const getAllStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed reading notifications from storage:', err);
  }
  return [];
};

export const filterNotificationForUser = (n: AppNotification, currentUser?: Profile | null): boolean => {
  if (!currentUser) return true;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'ceo';

  // Broadcast notifications are visible to everyone
  if (n.target_type === 'all' || n.user_id === 'all') return true;

  // Notifications with no specific recipients default to broadcast/public
  if (!n.recipient_ids || n.recipient_ids.length === 0) {
    if (!n.user_id || n.user_id === 'all') return true;
  }

  // Direct match by user_id
  if (n.user_id && n.user_id === currentUser.id) return true;

  // Recipient list includes current user
  if (n.recipient_ids && n.recipient_ids.includes(currentUser.id)) return true;

  // Sender can always see what they sent
  if (n.sender_id && n.sender_id === currentUser.id) return true;

  // Admin can see notifications across the team for oversight
  if (isAdmin) return true;

  return false;
};

export const getStoredNotifications = (currentUser?: Profile | null): AppNotification[] => {
  const all = getAllStoredNotifications();
  if (!currentUser) return all;
  return all.filter(n => filterNotificationForUser(n, currentUser));
};

export const saveNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('ceova_notifications_updated', { detail: notifications }));
  } catch (err) {
    console.error('Failed saving notifications:', err);
  }
};

/**
 * Fetch latest notifications from Supabase and sync with local storage cache
 */
export const fetchNotificationsFromSupabase = async (
  currentUser?: Profile | null
): Promise<AppNotification[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return getStoredNotifications(currentUser);
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.warn('Error fetching notifications from Supabase:', error.message);
      return getStoredNotifications(currentUser);
    }

    if (data && Array.isArray(data)) {
      const mapped = data.map(mapDbRowToNotification);
      saveNotifications(mapped);
      return currentUser ? mapped.filter(n => filterNotificationForUser(n, currentUser)) : mapped;
    }
  } catch (err) {
    console.error('Failed fetching notifications from Supabase:', err);
  }

  return getStoredNotifications(currentUser);
};

let activeRealtimeChannel: any = null;
let realtimeRefCount = 0;

/**
 * Subscribes to Supabase Realtime events on public.notifications table.
 * When any user inserts, updates, or deletes a notification, all connected
 * devices receive the event and update their local cache and badge immediately.
 */
export const subscribeToNotificationsRealtime = (
  onUpdate?: (notifications: AppNotification[]) => void,
  currentUser?: Profile | null
): (() => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return () => {};
  }

  realtimeRefCount++;

  if (!activeRealtimeChannel) {
    activeRealtimeChannel = supabase
      .channel('ceova-notifications-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          handleRealtimeEvent(payload, onUpdate, currentUser);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Refresh on successful connection to catch any missed updates
          fetchNotificationsFromSupabase(currentUser).catch(console.error);
        }
      });
  }

  return () => {
    realtimeRefCount = Math.max(0, realtimeRefCount - 1);
    if (realtimeRefCount === 0 && activeRealtimeChannel) {
      supabase.removeChannel(activeRealtimeChannel);
      activeRealtimeChannel = null;
    }
  };
};

function handleRealtimeEvent(
  payload: any,
  onUpdate?: (notifications: AppNotification[]) => void,
  currentUser?: Profile | null
) {
  const current = getAllStoredNotifications();
  let updatedList = [...current];

  if (payload.eventType === 'INSERT' && payload.new) {
    const newNotif = mapDbRowToNotification(payload.new);
    if (!updatedList.some(n => n.id === newNotif.id)) {
      updatedList = [newNotif, ...updatedList];
    }
  } else if (payload.eventType === 'UPDATE' && payload.new) {
    const updatedNotif = mapDbRowToNotification(payload.new);
    updatedList = updatedList.map(n => (n.id === updatedNotif.id ? updatedNotif : n));
  } else if (payload.eventType === 'DELETE' && payload.old) {
    const deletedId = payload.old.id;
    updatedList = updatedList.filter(n => n.id !== deletedId);
  }

  saveNotifications(updatedList);

  if (onUpdate) {
    const filtered = currentUser ? updatedList.filter(n => filterNotificationForUser(n, currentUser)) : updatedList;
    onUpdate(filtered);
  }
}

export const addNotification = async (
  notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>
): Promise<AppNotification> => {
  const newNotif: AppNotification = {
    id: generateUUID(),
    ...notif,
    read: false,
    created_at: new Date().toISOString()
  };

  // Optimistic local update for instant UI feedback
  const current = getAllStoredNotifications();
  const updated = [newNotif, ...current.filter(n => n.id !== newNotif.id)];
  saveNotifications(updated);

  // Persist to Supabase database for cross-device, cross-user realtime delivery
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const dbRow = mapNotificationToDbRow(newNotif);
      const { data, error } = await supabase
        .from('notifications')
        .insert([dbRow])
        .select()
        .single();

      if (error) {
        console.error('Failed inserting notification to Supabase:', error.message);
      } else if (data) {
        const persistedNotif = mapDbRowToNotification(data);
        const latest = getAllStoredNotifications();
        const merged = latest.map(n => (n.id === newNotif.id ? persistedNotif : n));
        saveNotifications(merged);
      }
    } catch (dbErr) {
      console.error('Error inserting notification to Supabase:', dbErr);
    }
  }

  // Automatically send notification to user email via Resend API
  dispatchNotificationEmails(newNotif).catch(err => {
    console.warn('[Resend Email] Dispatch background error:', err);
  });

  return newNotif;
};

export interface SendMemberNotificationParams {
  sender: Profile;
  target_type: 'all' | 'members';
  recipient_ids: string[];
  recipient_names?: string[];
  recipient_emails?: string[];
  title: string;
  message: string;
  link?: string;
  photos?: NotificationAttachment[];
  files?: NotificationAttachment[];
}

export const sendMemberNotification = async (
  params: SendMemberNotificationParams
): Promise<AppNotification> => {
  const { sender, target_type, recipient_ids, recipient_names, recipient_emails, title, message, link, photos, files } = params;

  const isAdmin = sender.role === 'admin' || sender.role === 'ceo';

  // Role validation: Members and Interns can only send to specific members
  if (!isAdmin && target_type === 'all') {
    throw new Error('Members and interns can only send notifications to selected members.');
  }

  if (target_type === 'members' && (!recipient_ids || recipient_ids.length === 0)) {
    throw new Error('Please select at least one member to send the notification to.');
  }

  // Filter attachments strictly to photos and files only
  const validPhotos = (photos || []).filter(p => p.type === 'photo');
  const validFiles = (files || []).filter(f => f.type === 'file');

  const newNotification: Omit<AppNotification, 'id' | 'created_at' | 'read'> = {
    title: title.trim(),
    message: message.trim(),
    type: 'message',
    sender_id: sender.id,
    sender_name: sender.full_name || 'Team Member',
    sender_role: sender.role,
    sender_avatar: sender.avatar_url,
    target_type,
    recipient_ids: target_type === 'all' ? [] : recipient_ids,
    recipient_names: target_type === 'all' ? ['Everyone'] : (recipient_names || []),
    link: link && link.trim() ? link.trim() : undefined,
    photos: validPhotos.length > 0 ? validPhotos : undefined,
    files: validFiles.length > 0 ? validFiles : undefined,
    user_id: target_type === 'all' ? 'all' : (recipient_ids.length === 1 ? recipient_ids[0] : null)
  };

  return await addNotification(newNotification);
};

export const isNotificationReadByUser = (n: AppNotification, user?: Profile | null): boolean => {
  if (!user) return n.read;
  // If the user is the sender, they already know what they sent
  if (n.sender_id === user.id) return true;
  // Check read_by_ids array
  if (n.read_by_ids && n.read_by_ids.length > 0) {
    return n.read_by_ids.includes(user.id);
  }
  // Fallback to legacy single read flag if this notification was specifically for this user
  if (n.user_id === user.id || (n.recipient_ids && n.recipient_ids.length === 1 && n.recipient_ids[0] === user.id)) {
    return n.read;
  }
  return n.read;
};

export interface ReadReceiptStats {
  isFullySeen: boolean;
  seenCount: number;
  totalRecipients: number;
  seenNames: string[];
  isBroadcast: boolean;
}

export const getNotificationReadReceipt = (
  n: AppNotification, 
  allMembers: Profile[] = []
): ReadReceiptStats => {
  const seenIds = n.read_by_ids || [];
  const seenNames = n.read_by_names ? [...n.read_by_names] : [];

  // Match any missing names from allMembers
  seenIds.forEach(id => {
    const mem = allMembers.find(m => m.id === id);
    if (mem?.full_name && !seenNames.includes(mem.full_name)) {
      seenNames.push(mem.full_name);
    }
  });

  const isBroadcast = n.target_type === 'all' || n.user_id === 'all';
  let totalRecipients = 1;

  if (isBroadcast) {
    // Total recipients is all other active members in workspace
    const otherMembers = allMembers.filter(m => m.id !== n.sender_id);
    totalRecipients = otherMembers.length > 0 ? otherMembers.length : (seenIds.length > 0 ? seenIds.length : 1);
  } else if (n.recipient_ids && n.recipient_ids.length > 0) {
    totalRecipients = n.recipient_ids.length;
  } else if (n.recipient_names && n.recipient_names.length > 0) {
    totalRecipients = n.recipient_names.length;
  }

  const seenCount = seenIds.length;
  const isFullySeen = totalRecipients > 0 && seenCount >= totalRecipients;

  return {
    isFullySeen,
    seenCount,
    totalRecipients,
    seenNames,
    isBroadcast
  };
};

export const markNotificationRead = async (id: string, reader?: Profile | null) => {
  const current = getAllStoredNotifications();
  let changed = false;
  let targetNotif: AppNotification | null = null;

  const updated = current.map(n => {
    if (n.id !== id) return n;

    const readByIds = n.read_by_ids ? [...n.read_by_ids] : [];
    const readByNames = n.read_by_names ? [...n.read_by_names] : [];

    if (reader && reader.id) {
      if (!readByIds.includes(reader.id)) {
        readByIds.push(reader.id);
        const name = reader.full_name || 'Member';
        if (!readByNames.includes(name)) {
          readByNames.push(name);
        }
        changed = true;
      }
    }

    if (!n.read) {
      changed = true;
    }

    const modified = {
      ...n,
      read: true,
      read_by_ids: readByIds,
      read_by_names: readByNames
    };
    targetNotif = modified;
    return modified;
  });

  if (changed) {
    saveNotifications(updated);
  }

  // Sync read status to Supabase
  const supabase = getSupabaseClient();
  if (supabase && targetNotif) {
    try {
      await supabase
        .from('notifications')
        .update({
          read: true,
          read_by_ids: (targetNotif as AppNotification).read_by_ids || [],
          read_by_names: (targetNotif as AppNotification).read_by_names || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed syncing read status to Supabase:', err);
    }
  }
};

export const markMultipleNotificationsRead = async (ids: string[], reader?: Profile | null) => {
  if (ids.length === 0) return;
  const current = getAllStoredNotifications();
  let changed = false;
  const idSet = new Set(ids);
  const updatedNotifs: AppNotification[] = [];

  const updated = current.map(n => {
    if (!idSet.has(n.id)) return n;

    const readByIds = n.read_by_ids ? [...n.read_by_ids] : [];
    const readByNames = n.read_by_names ? [...n.read_by_names] : [];

    if (reader && reader.id) {
      if (!readByIds.includes(reader.id)) {
        readByIds.push(reader.id);
        const name = reader.full_name || 'Member';
        if (!readByNames.includes(name)) {
          readByNames.push(name);
        }
        changed = true;
      }
    }

    if (!n.read) {
      changed = true;
    }

    const modified = {
      ...n,
      read: true,
      read_by_ids: readByIds,
      read_by_names: readByNames
    };
    updatedNotifs.push(modified);
    return modified;
  });

  if (changed) {
    saveNotifications(updated);
  }

  // Sync to Supabase
  const supabase = getSupabaseClient();
  if (supabase && updatedNotifs.length > 0) {
    try {
      await Promise.all(
        updatedNotifs.map(n =>
          supabase
            .from('notifications')
            .update({
              read: true,
              read_by_ids: n.read_by_ids || [],
              read_by_names: n.read_by_names || [],
              updated_at: new Date().toISOString()
            })
            .eq('id', n.id)
        )
      );
    } catch (err) {
      console.warn('Failed syncing multiple read status to Supabase:', err);
    }
  }
};

export const markAllNotificationsRead = async (reader?: Profile | null) => {
  const current = getAllStoredNotifications();
  const visible = current.filter(n => filterNotificationForUser(n, reader));
  const unreadVisibleIds = visible
    .filter(n => !isNotificationReadByUser(n, reader))
    .map(n => n.id);

  if (unreadVisibleIds.length > 0) {
    await markMultipleNotificationsRead(unreadVisibleIds, reader);
  }
};

export const deleteNotification = async (id: string) => {
  const current = getAllStoredNotifications();
  const updated = current.filter(n => n.id !== id);
  saveNotifications(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error('Failed deleting notification from Supabase:', err);
    }
  }
};

export const clearAllNotifications = async (currentUser?: Profile | null) => {
  const current = getAllStoredNotifications();
  const toDelete = currentUser ? current.filter(n => filterNotificationForUser(n, currentUser)) : current;
  const remaining = currentUser ? current.filter(n => !filterNotificationForUser(n, currentUser)) : [];

  saveNotifications(remaining);

  const supabase = getSupabaseClient();
  if (supabase && toDelete.length > 0) {
    try {
      const ids = toDelete.map(n => n.id);
      await supabase.from('notifications').delete().in('id', ids);
    } catch (err) {
      console.error('Failed clearing notifications from Supabase:', err);
    }
  }
};
