import { AppNotification, Profile, NotificationAttachment, UserRole } from '../types';
import { dispatchNotificationEmails } from './emailService';

const NOTIFICATIONS_STORAGE_KEY = 'ceova_notifications_v2';

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_welcome',
    user_id: 'all',
    target_type: 'all',
    title: 'Welcome to Ceova Enterprise Portal',
    message: 'Your executive dashboard, team deliverable pipelines, and live Google Meet calendar are active.',
    type: 'system',
    read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'notif_deliverable_req',
    user_id: 'all',
    target_type: 'all',
    title: 'Deliverable Guideline Notice',
    message: 'All tasks marked with Deliverable Requirement require file proof or written completion summary before submission.',
    type: 'task',
    read: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const getAllStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(n => n.id !== 'notif_meet_sync');
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed reading notifications from storage:', err);
  }
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(SEED_NOTIFICATIONS));
  return SEED_NOTIFICATIONS;
};

export const getStoredNotifications = (currentUser?: Profile | null): AppNotification[] => {
  const all = getAllStoredNotifications();
  if (!currentUser) return all;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'ceo';

  return all.filter(n => {
    // Broadcast notifications are visible to everyone
    if (n.target_type === 'all' || n.user_id === 'all') return true;

    // Notifications with no specific recipients default to public
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
  });
};

export const saveNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new CustomEvent('ceova_notifications_updated', { detail: notifications }));
  } catch (err) {
    console.error('Failed saving notifications:', err);
  }
};

export const addNotification = (notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>): AppNotification => {
  const current = getAllStoredNotifications();
  const newNotif: AppNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    ...notif,
    read: false,
    created_at: new Date().toISOString()
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);

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

export const sendMemberNotification = (params: SendMemberNotificationParams): AppNotification => {
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

  return addNotification(newNotification);
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

export const markNotificationRead = (id: string, reader?: Profile | null) => {
  const current = getAllStoredNotifications();
  let changed = false;
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

    return {
      ...n,
      read: true,
      read_by_ids: readByIds,
      read_by_names: readByNames
    };
  });

  if (changed) {
    saveNotifications(updated);
  }
};

export const markMultipleNotificationsRead = (ids: string[], reader?: Profile | null) => {
  if (ids.length === 0) return;
  const current = getAllStoredNotifications();
  let changed = false;
  const idSet = new Set(ids);

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

    return {
      ...n,
      read: true,
      read_by_ids: readByIds,
      read_by_names: readByNames
    };
  });

  if (changed) {
    saveNotifications(updated);
  }
};

export const markAllNotificationsRead = (reader?: Profile | null) => {
  const current = getAllStoredNotifications();
  const updated = current.map(n => {
    const readByIds = n.read_by_ids ? [...n.read_by_ids] : [];
    const readByNames = n.read_by_names ? [...n.read_by_names] : [];

    if (reader && reader.id && !readByIds.includes(reader.id)) {
      readByIds.push(reader.id);
      const name = reader.full_name || 'Member';
      if (!readByNames.includes(name)) {
        readByNames.push(name);
      }
    }

    return {
      ...n,
      read: true,
      read_by_ids: readByIds,
      read_by_names: readByNames
    };
  });
  saveNotifications(updated);
};

export const deleteNotification = (id: string) => {
  const current = getAllStoredNotifications();
  const updated = current.filter(n => n.id !== id);
  saveNotifications(updated);
};

export const clearAllNotifications = () => {
  saveNotifications([]);
};
