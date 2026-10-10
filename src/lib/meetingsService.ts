import { Meeting, Profile } from '../types';
import { addNotification } from './notificationsService';

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

  // Automatically dispatch notification
  const audienceText = newMeeting.target_type === 'all'
    ? 'All Members'
    : (newMeeting.attendee_names && newMeeting.attendee_names.length > 0)
      ? newMeeting.attendee_names.join(', ')
      : 'Invited Members';

  addNotification({
    title: `New Meeting: ${newMeeting.title}`,
    message: `${newMeeting.created_by_name} scheduled a Google Meet for ${newMeeting.date} at ${newMeeting.start_time} (${audienceText}).`,
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
      date: newMeeting.date,
      start_time: newMeeting.start_time,
      meet_link: newMeeting.meet_link,
      category: newMeeting.category,
      target_type: newMeeting.target_type,
      attendees: newMeeting.attendee_names
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

  // Dispatch notification about updated meeting
  const audienceText = updatedMeeting.target_type === 'all'
    ? 'All Members'
    : (updatedMeeting.attendee_names && updatedMeeting.attendee_names.length > 0)
      ? updatedMeeting.attendee_names.join(', ')
      : 'Invited Members';

  addNotification({
    title: `Updated Meeting: ${updatedMeeting.title}`,
    message: `${updatedMeeting.created_by_name || 'Admin'} updated meeting details for ${updatedMeeting.date} at ${updatedMeeting.start_time} (${audienceText}).`,
    type: 'meeting',
    link: updatedMeeting.meet_link,
    user_id: updatedMeeting.target_type === 'all' ? 'all' : (updatedMeeting.attendee_ids?.[0] || 'all'),
    meeting_id: updatedMeeting.id,
    meta: {
      date: updatedMeeting.date,
      start_time: updatedMeeting.start_time,
      meet_link: updatedMeeting.meet_link,
      category: updatedMeeting.category,
      target_type: updatedMeeting.target_type,
      attendees: updatedMeeting.attendee_names
    }
  });

  return updatedMeeting;
};

export const deleteMeeting = (id: string) => {
  const current = getStoredMeetings();
  const updated = current.filter(m => m.id !== id);
  saveMeetings(updated);
};

export const getVisibleMeetings = (currentUser: Profile | null): Meeting[] => {
  const all = getStoredMeetings();
  if (!currentUser) return all;

  // Admins and CEOs can see all meetings
  if (currentUser.role === 'admin' || currentUser.role === 'ceo') {
    return all;
  }

  // Regular members and interns see meetings targeted to all or where their id is in attendees
  return all.filter(m => {
    if (m.target_type === 'all') return true;
    if (m.attendee_ids && m.attendee_ids.includes(currentUser.id)) return true;
    if (m.created_by_id === currentUser.id) return true;
    return false;
  });
};
