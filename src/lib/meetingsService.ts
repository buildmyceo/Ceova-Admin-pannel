import { Meeting, MeetingCategory, Profile, MeetingAttendance } from '../types';
import { addNotification } from './notificationsService';
import { getSupabaseClient } from './supabase';

const MEETINGS_STORAGE_KEY = 'ceova_meetings_v2';
const FAKE_MEETING_IDS = new Set(['meet_exec_standup', 'meet_sprint_review']);

// Clear fake seed meetings immediately
try {
  const existing = localStorage.getItem(MEETINGS_STORAGE_KEY);
  if (existing) {
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed)) {
      const filtered = parsed.filter(m => !FAKE_MEETING_IDS.has(m.id));
      localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(filtered));
    }
  }
} catch (e) {
  console.error(e);
}

export const getStoredMeetings = (): Meeting[] => {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(m => !FAKE_MEETING_IDS.has(m.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Failed reading meetings from storage:', err);
  }
  return [];
};

export const saveMeetings = (meetings: Meeting[]) => {
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
    window.dispatchEvent(new CustomEvent('ceova_meetings_updated', { detail: meetings }));
  } catch (err) {
    console.error('Failed saving meetings to storage:', err);
  }
};

/**
 * Reconstruct a complete Meeting object from a Supabase notification row
 */
export function mapNotificationRowToMeeting(row: any): Meeting {
  const meta = (row.meta && typeof row.meta === 'object') ? row.meta : {};
  const meetingId = row.meeting_id || meta.meeting_id || row.id;

  // Title cleanup
  let title = meta.title || row.title || 'Team Meeting';
  title = title.replace(/^(New Meeting:\s*|Updated Meeting:\s*)/i, '').trim();

  // Date and time resolution
  let date = meta.date || '';
  if (!date && row.created_at) {
    date = row.created_at.substring(0, 10);
  }
  if (!date && row.message) {
    const match = row.message.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) date = match[1];
  }

  let startTime = meta.start_time || '';
  if (!startTime && row.message) {
    const match = row.message.match(/at\s+(\d{1,2}:\d{2})/i);
    if (match) startTime = match[1];
  }
  if (!startTime) startTime = '10:00';

  const durationMinutes = Number(meta.duration_minutes) || 30;

  let endTime = meta.end_time;
  if (!endTime && startTime) {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + durationMinutes;
      const endH = Math.floor(totalMinutes / 60) % 24;
      const endM = totalMinutes % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    } catch {}
  }

  // Description
  let description = meta.description;
  if (!description && row.message) {
    const noteMatch = row.message.match(/Note\s*\/\s*Agenda:\s*([\s\S]+)$/i);
    if (noteMatch) {
      description = noteMatch[1].trim();
    } else if (!row.message.toLowerCase().includes('scheduled a google meet for')) {
      description = row.message;
    }
  }

  const meetLink = meta.meet_link || row.link || '';
  const category = (meta.category as MeetingCategory) || 'general';
  const targetType = (meta.target_type || row.target_type || 'members') === 'all' ? 'all' : 'members';

  const attendeeIds = meta.attendee_ids || (Array.isArray(row.recipient_ids) ? row.recipient_ids : []);
  const attendeeNames = meta.attendees || (Array.isArray(row.recipient_names) ? row.recipient_names : []);

  return {
    id: meetingId,
    title,
    description: description || null,
    meet_link: meetLink,
    date,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: durationMinutes,
    category,
    target_type: targetType,
    attendee_ids: attendeeIds,
    attendee_names: attendeeNames,
    created_by_id: meta.created_by_id || row.sender_id || '',
    created_by_name: meta.created_by_name || row.sender_name || 'Admin',
    created_at: meta.created_at || row.created_at || new Date().toISOString(),
    status: meta.status || 'upcoming',
    attendance: meta.attendance || undefined
  };
}

/**
 * Filter meetings visible to the given user based on role, ID, and attendee name matches
 */
export const filterVisibleMeetings = (meetings: Meeting[], currentUser?: Profile | null): Meeting[] => {
  if (!currentUser) return meetings;

  // Admins and CEOs can oversee all scheduled meetings
  if (currentUser.role === 'admin' || currentUser.role === 'ceo') {
    return meetings;
  }

  const currentUserId = (currentUser.id || '').toLowerCase().trim();
  const currentUserName = (currentUser.full_name || '').toLowerCase().trim();
  const currentUserEmail = (currentUser.email || '').toLowerCase().trim();
  const userIdentifiers = [
    currentUserName,
    currentUserEmail,
    (currentUser as any).username?.trim().toLowerCase()
  ].filter(Boolean) as string[];

  return meetings.filter(m => {
    // 1. Broadcast meetings are visible to everyone in the workspace
    if (m.target_type === 'all') return true;

    // 2. Creator can always see their own meeting
    if (m.created_by_id && m.created_by_id.toLowerCase().trim() === currentUserId) {
      return true;
    }

    // 3. User ID match in attendee_ids
    if (m.attendee_ids && Array.isArray(m.attendee_ids)) {
      const idMatch = m.attendee_ids.some(id => id && id.toLowerCase().trim() === currentUserId);
      if (idMatch) return true;
    }

    // 4. Exact name or email match in attendee_names
    if (m.attendee_names && Array.isArray(m.attendee_names)) {
      const nameMatch = m.attendee_names.some(name => {
        if (!name) return false;
        const normName = name.trim().toLowerCase();
        // Exact identifier match
        if (userIdentifiers.some(uid => uid === normName)) return true;
        // Match name with email appended e.g. "Full Name (email@domain.com)"
        if (currentUserEmail && normName.includes(`(${currentUserEmail})`)) return true;
        if (currentUserName && normName.startsWith(currentUserName)) return true;
        return false;
      });
      if (nameMatch) return true;
    }

    // If target_type is 'members', uninvited users cannot see it
    return false;
  });
};

export const getVisibleMeetings = (currentUser: Profile | null): Meeting[] => {
  const all = getStoredMeetings();
  return filterVisibleMeetings(all, currentUser);
};

/**
 * Fetch latest meetings from Supabase notifications table, merge with local cache, and return visible meetings
 */
export const fetchMeetingsFromSupabase = async (
  currentUser?: Profile | null
): Promise<Meeting[]> => {
  const local = getStoredMeetings();
  const supabase = getSupabaseClient();
  if (!supabase) {
    return filterVisibleMeetings(local, currentUser);
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'meeting')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching meetings from Supabase:', error.message);
      return filterVisibleMeetings(local, currentUser);
    }

    if (data && Array.isArray(data)) {
      const remoteMeetings = data.map(mapNotificationRowToMeeting);
      const meetingMap = new Map<string, Meeting>();

      // Populate with existing local meetings
      local.forEach(m => {
        if (!FAKE_MEETING_IDS.has(m.id)) {
          meetingMap.set(m.id, m);
        }
      });

      // Merge remote meetings
      remoteMeetings.forEach(rm => {
        if (FAKE_MEETING_IDS.has(rm.id)) return;
        const existing = meetingMap.get(rm.id);
        if (existing) {
          meetingMap.set(rm.id, {
            ...existing,
            ...rm,
            description: rm.description || existing.description || null
          });
        } else {
          meetingMap.set(rm.id, rm);
        }
      });

      const merged = Array.from(meetingMap.values()).sort((a, b) => {
        return new Date(`${b.date}T${b.start_time || '00:00'}`).getTime() - 
               new Date(`${a.date}T${a.start_time || '00:00'}`).getTime();
      });

      saveMeetings(merged);
      return filterVisibleMeetings(merged, currentUser);
    }
  } catch (err) {
    console.error('Failed fetching meetings from Supabase:', err);
  }

  return filterVisibleMeetings(local, currentUser);
};

export const createMeeting = (
  meetingData: Omit<Meeting, 'id' | 'created_at'>
): Meeting => {
  const current = getStoredMeetings();
  const newMeeting: Meeting = {
    id: 'meet_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    ...meetingData,
    created_at: new Date().toISOString(),
    status: 'upcoming'
  };

  const updated = [newMeeting, ...current];
  saveMeetings(updated);

  // Automatically dispatch notification to Supabase and email
  const scheduleLine = `${newMeeting.created_by_name} scheduled a Google Meet for ${newMeeting.date} at ${newMeeting.start_time}.`;
  const messageBody = newMeeting.description && newMeeting.description.trim()
    ? `${scheduleLine}\n\nNote / Agenda:\n${newMeeting.description.trim()}`
    : scheduleLine;

  addNotification({
    title: `New Meeting: ${newMeeting.title}`,
    message: messageBody,
    type: 'meeting',
    link: newMeeting.meet_link,
    sender_id: newMeeting.created_by_id,
    sender_name: newMeeting.created_by_name,
    target_type: newMeeting.target_type === 'all' ? 'all' : 'members',
    recipient_ids: newMeeting.target_type === 'all' ? [] : (newMeeting.attendee_ids || []),
    recipient_names: newMeeting.target_type === 'all' ? ['Everyone'] : (newMeeting.attendee_names || []),
    user_id: newMeeting.target_type === 'all' ? 'all' : (newMeeting.attendee_ids?.[0] || 'all'),
    meeting_id: newMeeting.id,
    meta: {
      meeting_id: newMeeting.id,
      title: newMeeting.title,
      description: newMeeting.description || null,
      date: newMeeting.date,
      start_time: newMeeting.start_time,
      end_time: newMeeting.end_time || null,
      duration_minutes: newMeeting.duration_minutes || 30,
      meet_link: newMeeting.meet_link,
      category: newMeeting.category,
      target_type: newMeeting.target_type,
      attendee_ids: newMeeting.attendee_ids || [],
      attendees: newMeeting.attendee_names || [],
      created_by_id: newMeeting.created_by_id,
      created_by_name: newMeeting.created_by_name,
      created_at: newMeeting.created_at,
      status: newMeeting.status || 'upcoming',
      attendance: newMeeting.attendance || null
    }
  });

  return newMeeting;
};

export const updateMeeting = (
  id: string,
  updatedData: Partial<Meeting>
): Meeting | null => {
  const current = getStoredMeetings();
  const index = current.findIndex(m => m.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedMeeting: Meeting = {
    ...existing,
    ...updatedData,
    id: existing.id,
    created_at: existing.created_at
  };

  current[index] = updatedMeeting;
  saveMeetings([...current]);

  // Dispatch notification and sync to Supabase
  const updateScheduleLine = `${updatedMeeting.created_by_name || 'Admin'} updated meeting details for ${updatedMeeting.date} at ${updatedMeeting.start_time}.`;
  const updateMessageBody = updatedMeeting.description && updatedMeeting.description.trim()
    ? `${updateScheduleLine}\n\nNote / Agenda:\n${updatedMeeting.description.trim()}`
    : updateScheduleLine;

  addNotification({
    title: `Updated Meeting: ${updatedMeeting.title}`,
    message: updateMessageBody,
    type: 'meeting',
    link: updatedMeeting.meet_link,
    sender_id: updatedMeeting.created_by_id,
    sender_name: updatedMeeting.created_by_name,
    target_type: updatedMeeting.target_type === 'all' ? 'all' : 'members',
    recipient_ids: updatedMeeting.target_type === 'all' ? [] : (updatedMeeting.attendee_ids || []),
    recipient_names: updatedMeeting.target_type === 'all' ? ['Everyone'] : (updatedMeeting.attendee_names || []),
    user_id: updatedMeeting.target_type === 'all' ? 'all' : (updatedMeeting.attendee_ids?.[0] || 'all'),
    meeting_id: updatedMeeting.id,
    meta: {
      meeting_id: updatedMeeting.id,
      title: updatedMeeting.title,
      description: updatedMeeting.description || null,
      date: updatedMeeting.date,
      start_time: updatedMeeting.start_time,
      end_time: updatedMeeting.end_time || null,
      duration_minutes: updatedMeeting.duration_minutes || 30,
      meet_link: updatedMeeting.meet_link,
      category: updatedMeeting.category,
      target_type: updatedMeeting.target_type,
      attendee_ids: updatedMeeting.attendee_ids || [],
      attendees: updatedMeeting.attendee_names || [],
      created_by_id: updatedMeeting.created_by_id,
      created_by_name: updatedMeeting.created_by_name,
      status: updatedMeeting.status || 'upcoming',
      attendance: updatedMeeting.attendance || null
    }
  });

  // Also update existing notification in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase
      .from('notifications')
      .update({
        title: `Meeting: ${updatedMeeting.title}`,
        link: updatedMeeting.meet_link,
        recipient_ids: updatedMeeting.attendee_ids || [],
        recipient_names: updatedMeeting.attendee_names || [],
        meta: {
          meeting_id: updatedMeeting.id,
          title: updatedMeeting.title,
          description: updatedMeeting.description || null,
          date: updatedMeeting.date,
          start_time: updatedMeeting.start_time,
          end_time: updatedMeeting.end_time || null,
          duration_minutes: updatedMeeting.duration_minutes || 30,
          meet_link: updatedMeeting.meet_link,
          category: updatedMeeting.category,
          target_type: updatedMeeting.target_type,
          attendee_ids: updatedMeeting.attendee_ids || [],
          attendees: updatedMeeting.attendee_names || [],
          created_by_id: updatedMeeting.created_by_id,
          created_by_name: updatedMeeting.created_by_name,
          status: updatedMeeting.status || 'upcoming',
          attendance: updatedMeeting.attendance || null
        },
        updated_at: new Date().toISOString()
      })
      .eq('meeting_id', id)
      .then(({ error }) => {
        if (error) console.warn('Failed updating meeting in Supabase:', error.message);
      });
  }

  return updatedMeeting;
};

/**
 * Update meeting attendance records and sync across local storage and Supabase
 */
export const updateMeetingAttendance = async (
  id: string,
  attendance: MeetingAttendance,
  newMeetingStatus: 'upcoming' | 'ongoing' | 'completed' | 'cancelled' = 'completed'
): Promise<Meeting | null> => {
  const current = getStoredMeetings();
  const index = current.findIndex(m => m.id === id);
  if (index === -1) return null;

  const existing = current[index];
  const updatedMeeting: Meeting = {
    ...existing,
    status: newMeetingStatus,
    attendance
  };

  current[index] = updatedMeeting;
  saveMeetings([...current]);

  // Dispatch attendance notification to meeting attendees
  const presentRate = Math.round((attendance.present_count / (attendance.total_attendees || 1)) * 100);
  addNotification({
    title: `Attendance Finalized: ${updatedMeeting.title}`,
    message: `${attendance.marked_by_name || 'Meeting Host'} marked attendance for "${updatedMeeting.title}". Result: ${attendance.present_count}/${attendance.total_attendees} attended (${presentRate}%). Check your attendance scorecard in the portal.`,
    type: 'meeting',
    link: updatedMeeting.meet_link,
    sender_id: attendance.marked_by_id,
    sender_name: attendance.marked_by_name,
    target_type: updatedMeeting.target_type === 'all' ? 'all' : 'members',
    recipient_ids: updatedMeeting.target_type === 'all' ? [] : (updatedMeeting.attendee_ids || []),
    recipient_names: updatedMeeting.target_type === 'all' ? ['Everyone'] : (updatedMeeting.attendee_names || []),
    user_id: updatedMeeting.target_type === 'all' ? 'all' : (updatedMeeting.attendee_ids?.[0] || 'all'),
    meeting_id: updatedMeeting.id,
    meta: {
      meeting_id: updatedMeeting.id,
      title: updatedMeeting.title,
      description: updatedMeeting.description || null,
      date: updatedMeeting.date,
      start_time: updatedMeeting.start_time,
      end_time: updatedMeeting.end_time || null,
      duration_minutes: updatedMeeting.duration_minutes || 30,
      meet_link: updatedMeeting.meet_link,
      category: updatedMeeting.category,
      target_type: updatedMeeting.target_type,
      attendee_ids: updatedMeeting.attendee_ids || [],
      attendees: updatedMeeting.attendee_names || [],
      created_by_id: updatedMeeting.created_by_id,
      created_by_name: updatedMeeting.created_by_name,
      status: newMeetingStatus,
      attendance
    }
  });

  // Sync to existing meeting row in Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from('notifications')
        .update({
          meta: {
            meeting_id: updatedMeeting.id,
            title: updatedMeeting.title,
            description: updatedMeeting.description || null,
            date: updatedMeeting.date,
            start_time: updatedMeeting.start_time,
            end_time: updatedMeeting.end_time || null,
            duration_minutes: updatedMeeting.duration_minutes || 30,
            meet_link: updatedMeeting.meet_link,
            category: updatedMeeting.category,
            target_type: updatedMeeting.target_type,
            attendee_ids: updatedMeeting.attendee_ids || [],
            attendees: updatedMeeting.attendee_names || [],
            created_by_id: updatedMeeting.created_by_id,
            created_by_name: updatedMeeting.created_by_name,
            status: newMeetingStatus,
            attendance
          },
          updated_at: new Date().toISOString()
        })
        .eq('meeting_id', id);
    } catch (err) {
      console.warn('Failed syncing attendance to Supabase:', err);
    }
  }

  return updatedMeeting;
};

export const deleteMeeting = (id: string) => {
  const current = getStoredMeetings();
  const updated = current.filter(m => m.id !== id);
  saveMeetings(updated);

  // Sync deletion with Supabase notifications
  const supabase = getSupabaseClient();
  if (supabase) {
    supabase
      .from('notifications')
      .delete()
      .eq('meeting_id', id)
      .then(({ error }) => {
        if (error) console.warn('Failed deleting meeting from Supabase:', error.message);
      });
  }
};
