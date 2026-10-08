import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { Meeting, MeetingCategory, Profile, Task, TaskPriority, TaskStatus } from '../types';
import { 
  getVisibleMeetings, 
  createMeeting, 
  updateMeeting,
  deleteMeeting 
} from '../lib/meetingsService';
import { getSupabaseClient } from '../lib/supabase';
import { sanitizeUrl, isSafeHttpUrl } from '../lib/security';
import { NavTab } from '../components/Sidebar';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Video, 
  Clock, 
  Users, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Edit2,
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  Search, 
  Lock,
  UserCheck,
  CheckSquare,
  ArrowRight,
  User,
  Tag,
  Layers,
  AlertTriangle
} from 'lucide-react';

const CATEGORY_CONFIG: Record<MeetingCategory, { label: string; color: string; bg: string; border: string }> = {
  executive: { label: 'Executive Sync', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)', border: '#2563eb' },
  standup: { label: 'Daily Standup', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', border: '#059669' },
  sprint: { label: 'Sprint Planning', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.12)', border: '#7c3aed' },
  review: { label: 'Product Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: '#d97706' },
  general: { label: 'General Meeting', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: '#475569' }
};

export const parseTaskDueDate = (task: Task): string | null => {
  if (!task.due_date) return null;
  const trimmed = task.due_date.trim();
  if (trimmed.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return null;
};

export const formatTaskDueTime = (dueDateStr?: string | null): string => {
  if (!dueDateStr) return 'End of day';
  try {
    if (dueDateStr.includes('T')) {
      const t = dueDateStr.split('T')[1];
      return t.substring(0, 5);
    }
    if (dueDateStr.includes(' ')) {
      const parts = dueDateStr.split(' ');
      if (parts[1]) return parts[1].substring(0, 5);
    }
    const d = new Date(dueDateStr);
    if (!isNaN(d.getTime())) {
      const hours = d.getHours();
      const mins = d.getMinutes();
      if (hours !== 0 || mins !== 0) {
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      }
    }
  } catch {}
  return 'End of day';
};

export const parseTaskCreatedDate = (task: Task): string | null => {
  if (!task.created_at) return null;
  try {
    return task.created_at.substring(0, 10);
  } catch {
    return null;
  }
};

const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
  high: { label: 'High', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316' },
  normal: { label: 'Normal', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
  low: { label: 'Low', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)', border: '#64748b' }
};

const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string }> = {
  todo: { label: 'To Do', color: '#a1a1aa', bg: '#27272a', border: '#3f3f46' },
  in_progress: { label: 'In Progress', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#2563eb' },
  review: { label: 'In Review', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', border: '#9333ea' },
  completed: { label: 'Completed', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: '#059669' }
};

interface CalendarViewProps {
  onNavigate?: (tab: NavTab) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { members } = usePortalData();

  const isAdminUser = Boolean(user && (user.role === 'admin' || user.role === 'ceo'));

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [copiedLinkMeetingId, setCopiedLinkMeetingId] = useState<string | null>(null);

  // Tasks and Deadlines State
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const cached = localStorage.getItem('ceova_local_tasks_cache_v2');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [calendarFilter, setCalendarFilter] = useState<'all' | 'meetings' | 'tasks'>('all');
  const [taskScope, setTaskScope] = useState<'all' | 'mine'>('all');
  const [upcomingTab, setUpcomingTab] = useState<'all' | 'meetings' | 'tasks'>('all');

  // Side Popover and Edit State
  const [isSidePopOpen, setIsSidePopOpen] = useState(true);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    meet_link: string;
    date: string;
    start_time: string;
    duration_minutes: number;
    category: MeetingCategory;
    target_type: 'all' | 'members';
    selected_attendee_ids: string[];
  }>({
    title: '',
    description: '',
    meet_link: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '14:00',
    duration_minutes: 45,
    category: 'executive',
    target_type: 'all',
    selected_attendee_ids: []
  });

  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load and subscribe to meetings and tasks
  const reloadMeetings = () => {
    setMeetings(getVisibleMeetings(user));
  };

  const reloadTasks = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true });
        if (!error && data) {
          setTasks(data as Task[]);
          localStorage.setItem('ceova_local_tasks_cache_v2', JSON.stringify(data));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed fetching supabase tasks for calendar:', e);
    }
    try {
      const cached = localStorage.getItem('ceova_local_tasks_cache_v2');
      if (cached) setTasks(JSON.parse(cached));
    } catch {}
  };

  useEffect(() => {
    reloadMeetings();
    reloadTasks();

    const handleMeetingsUpdate = () => reloadMeetings();
    const handleTasksUpdate = () => reloadTasks();

    window.addEventListener('ceova_meetings_updated', handleMeetingsUpdate);
    window.addEventListener('ceova_tasks_updated', handleTasksUpdate);
    window.addEventListener('storage', handleTasksUpdate);

    const supabase = getSupabaseClient();
    let channel: any = null;
    if (supabase) {
      channel = supabase
        .channel('ceova-calendar-realtime-tasks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
          reloadTasks();
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('ceova_meetings_updated', handleMeetingsUpdate);
      window.removeEventListener('ceova_tasks_updated', handleTasksUpdate);
      window.removeEventListener('storage', handleTasksUpdate);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [user]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
    setIsSidePopOpen(true);
  };

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsSidePopOpen(true);
    if (window.innerWidth <= 1100 && sidePanelRef.current) {
      sidePanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleOpenEditModal = (meeting: Meeting) => {
    if (!isAdminUser && meeting.created_by_id !== user?.id) return;
    setEditingMeetingId(meeting.id);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      meet_link: meeting.meet_link,
      date: meeting.date,
      start_time: meeting.start_time,
      duration_minutes: meeting.duration_minutes,
      category: meeting.category,
      target_type: meeting.target_type,
      selected_attendee_ids: meeting.attendee_ids || []
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Map meetings by date (YYYY-MM-DD)
  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach(m => {
      if (!map[m.date]) {
        map[m.date] = [];
      }
      map[m.date].push(m);
    });
    return map;
  }, [meetings]);

  // Selected date meetings
  const selectedDateMeetings = useMemo(() => {
    return meetingsByDate[selectedDateStr] || [];
  }, [meetingsByDate, selectedDateStr]);

  // Upcoming meetings list (sorted chronologically)
  const upcomingMeetings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...meetings]
      .filter(m => m.date >= todayStr)
      .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  }, [meetings]);

  // Filtered visible tasks according to taskScope
  const visibleTasks = useMemo(() => {
    if (!user) return tasks;
    if (taskScope === 'mine') {
      return tasks.filter(t => {
        const isAssigned = (t.assigned_to_ids && t.assigned_to_ids.includes(user.id)) ||
                           t.assigned_to_id === user.id ||
                           t.assigned_to_name === user.full_name ||
                           t.assigned_by_id === user.id;
        return isAssigned;
      });
    }
    return tasks;
  }, [tasks, user, taskScope]);

  // Tasks grouped by deadline date (YYYY-MM-DD)
  const tasksByDueDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    visibleTasks.forEach(t => {
      const d = parseTaskDueDate(t);
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    });
    return map;
  }, [visibleTasks]);

  // Tasks active on a given date's timeline (started on/before date and due after date)
  const getTasksOnTimeline = (dateStr: string): Task[] => {
    return visibleTasks.filter(t => {
      if (t.status === 'completed') return false;
      const start = parseTaskCreatedDate(t);
      const end = parseTaskDueDate(t);
      if (!start || !end) return false;
      return dateStr >= start && dateStr < end;
    });
  };

  // Selected date tasks
  const selectedDateTasks = useMemo(() => {
    return tasksByDueDate[selectedDateStr] || [];
  }, [tasksByDueDate, selectedDateStr]);

  const selectedDateTimelineTasks = useMemo(() => {
    return getTasksOnTimeline(selectedDateStr);
  }, [visibleTasks, selectedDateStr]);

  // Upcoming tasks (due today or in the future)
  const upcomingTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return [...visibleTasks]
      .filter(t => {
        const d = parseTaskDueDate(t);
        return d && d >= todayStr && t.status !== 'completed';
      })
      .sort((a, b) => {
        const da = parseTaskDueDate(a) || '';
        const db = parseTaskDueDate(b) || '';
        return da.localeCompare(db);
      });
  }, [visibleTasks]);

  // Combined upcoming schedule
  const combinedUpcoming = useMemo(() => {
    const list: Array<{
      type: 'meeting' | 'task';
      id: string;
      date: string;
      time: string;
      meeting?: Meeting;
      task?: Task;
    }> = [];

    if (upcomingTab === 'all' || upcomingTab === 'meetings') {
      upcomingMeetings.forEach(m => {
        list.push({
          type: 'meeting',
          id: `meet_${m.id}`,
          date: m.date,
          time: m.start_time,
          meeting: m
        });
      });
    }

    if (upcomingTab === 'all' || upcomingTab === 'tasks') {
      upcomingTasks.forEach(t => {
        const d = parseTaskDueDate(t) || '';
        const time = formatTaskDueTime(t.due_date);
        list.push({
          type: 'task',
          id: `task_${t.id}`,
          date: d,
          time: time,
          task: t
        });
      });
    }

    return list.sort((a, b) => {
      const cmpDate = a.date.localeCompare(b.date);
      if (cmpDate !== 0) return cmpDate;
      return a.time.localeCompare(b.time);
    });
  }, [upcomingMeetings, upcomingTasks, upcomingTab]);

  const handleCopyMeetLink = (meeting: Meeting) => {
    if (!meeting.meet_link) return;
    navigator.clipboard.writeText(meeting.meet_link);
    setCopiedLinkMeetingId(meeting.id);
    setTimeout(() => {
      setCopiedLinkMeetingId(null);
    }, 2000);
  };

  const handleDeleteMeeting = (id: string, title: string) => {
    if (!isAdminUser) return;
    if (window.confirm(`Are you sure you want to cancel and remove "${title}"?`)) {
      deleteMeeting(id);
    }
  };

  // Open modal with preselected date
  const handleOpenScheduleModal = (dateStr?: string) => {
    if (!isAdminUser) return;
    setEditingMeetingId(null);
    const targetDate = dateStr || selectedDateStr || new Date().toISOString().split('T')[0];
    setFormData({
      title: '',
      description: '',
      meet_link: '',
      date: targetDate,
      start_time: '15:00',
      duration_minutes: 45,
      category: 'executive',
      target_type: 'all',
      selected_attendee_ids: []
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const generateMeetCode = () => {
    const part = (len: number) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      let res = '';
      for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      return res;
    };
    return `${part(3)}-${part(4)}-${part(3)}`;
  };

  const handleToggleAttendee = (memberId: string) => {
    setFormData(prev => {
      const current = prev.selected_attendee_ids;
      const exists = current.includes(memberId);
      return {
        ...prev,
        selected_attendee_ids: exists 
          ? current.filter(id => id !== memberId) 
          : [...current, memberId]
      };
    });
  };

  const handleSelectAllMembers = () => {
    const activePool = members.filter(m => m.status !== 'blocked' && m.status !== 'paused');
    setFormData(prev => ({
      ...prev,
      selected_attendee_ids: activePool.map(m => m.id)
    }));
  };

  const handleClearAllMembers = () => {
    setFormData(prev => ({
      ...prev,
      selected_attendee_ids: []
    }));
  };

  const filteredMembersList = useMemo(() => {
    const activePool = members.filter(m => m.status !== 'blocked' && m.status !== 'paused');
    if (!memberSearchQuery.trim()) return activePool;
    const q = memberSearchQuery.toLowerCase();
    return activePool.filter(m => 
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.department?.toLowerCase().includes(q)
    );
  }, [members, memberSearchQuery]);

  const handleSubmitMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Meeting title is required.');
      return;
    }

    const cleanMeetLink = formData.meet_link.trim();
    if (!cleanMeetLink) {
      setFormError('Meeting link is required.');
      return;
    }

    if (!isSafeHttpUrl(cleanMeetLink)) {
      setFormError('Please enter a valid HTTP/HTTPS meeting link (e.g. https://meet.google.com/xyz).');
      return;
    }

    if (!formData.date) {
      setFormError('Please select a valid meeting date.');
      return;
    }

    if (formData.target_type === 'members' && formData.selected_attendee_ids.length === 0) {
      setFormError('Please select at least one team member or switch to "All Members".');
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve attendee names
      const selectedNames = formData.target_type === 'all'
        ? ['All Team Members']
        : members
            .filter(m => formData.selected_attendee_ids.includes(m.id))
            .map(m => m.full_name);

      if (editingMeetingId) {
        updateMeeting(editingMeetingId, {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          meet_link: sanitizeUrl(cleanMeetLink),
          date: formData.date,
          start_time: formData.start_time,
          duration_minutes: formData.duration_minutes,
          category: formData.category,
          target_type: formData.target_type,
          attendee_ids: formData.target_type === 'all' ? [] : formData.selected_attendee_ids,
          attendee_names: selectedNames
        });
        setIsAddModalOpen(false);
        setEditingMeetingId(null);
        reloadMeetings();
      } else {
        createMeeting({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          meet_link: sanitizeUrl(cleanMeetLink),
          date: formData.date,
          start_time: formData.start_time,
          duration_minutes: formData.duration_minutes,
          category: formData.category,
          target_type: formData.target_type,
          attendee_ids: formData.target_type === 'all' ? [] : formData.selected_attendee_ids,
          attendee_names: selectedNames,
          created_by_id: user?.id || 'admin_user',
          created_by_name: user?.full_name || 'Admin',
          status: 'upcoming'
        });
        setIsAddModalOpen(false);
        reloadMeetings();
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save meeting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 18
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#18181b',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <CalendarIcon size={19} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(18px, 4.5vw, 22px)', fontWeight: 700, margin: 0, color: 'var(--text-main, #ffffff)' }}>
                Calendar &amp; Meetings
              </h1>
              <span style={{
                background: '#14291f',
                border: '1px solid #1e4631',
                color: '#34d399',
                fontSize: 10.5,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Video size={11} /> Google Meet Live
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted, #a1a1aa)' }}>
            Coordinate Google Meet syncs, track team tasks, and monitor upcoming deadlines and project timelines.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onNavigate?.('tasks')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#18181b',
              border: '1px solid #27272a',
              color: '#ffffff',
              padding: '8px 14px',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
          >
            <CheckSquare size={14} style={{ color: '#fbbf24' }} />
            <span>Tasks Board</span>
          </button>

          {isAdminUser ? (
            <button
              type="button"
              onClick={() => handleOpenScheduleModal()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                background: '#ffffff',
                color: '#09090b',
                border: 'none',
                padding: '8px 15px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e4e4e7'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
            >
              <Plus size={15} />
              <span>Add Meeting</span>
            </button>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 8,
              background: '#18181b',
              border: '1px solid #27272a',
              color: 'var(--text-muted)',
              fontSize: 12
            }}>
              <Lock size={13} />
              <span>Admin-Only Meeting Scheduler</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 14px',
        background: '#121214',
        border: '1px solid #27272a',
        borderRadius: 12,
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
            Show:
          </span>
          <button
            type="button"
            onClick={() => setCalendarFilter('all')}
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              background: calendarFilter === 'all' ? '#ffffff' : '#18181b',
              color: calendarFilter === 'all' ? '#09090b' : '#a1a1aa',
              border: calendarFilter === 'all' ? 'none' : '1px solid #27272a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            All Items ({meetings.length + visibleTasks.filter(t => !!parseTaskDueDate(t)).length})
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilter('meetings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 6,
              background: calendarFilter === 'meetings' ? '#ffffff' : '#18181b',
              color: calendarFilter === 'meetings' ? '#09090b' : '#a1a1aa',
              border: calendarFilter === 'meetings' ? 'none' : '1px solid #27272a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Video size={12} />
            <span>Meetings ({meetings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilter('tasks')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              borderRadius: 6,
              background: calendarFilter === 'tasks' ? '#ffffff' : '#18181b',
              color: calendarFilter === 'tasks' ? '#09090b' : '#a1a1aa',
              border: calendarFilter === 'tasks' ? 'none' : '1px solid #27272a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <CheckSquare size={12} />
            <span>Task Deadlines ({visibleTasks.filter(t => !!parseTaskDueDate(t)).length})</span>
          </button>
        </div>

        {calendarFilter !== 'meetings' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#71717a' }}>Tasks:</span>
            <div style={{ display: 'inline-flex', background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: 2 }}>
              <button
                type="button"
                onClick={() => setTaskScope('all')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: taskScope === 'all' ? '#27272a' : 'transparent',
                  color: taskScope === 'all' ? '#ffffff' : '#71717a',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                All Workspace
              </button>
              <button
                type="button"
                onClick={() => setTaskScope('mine')}
                style={{
                  padding: '3px 8px',
                  borderRadius: 4,
                  background: taskScope === 'mine' ? '#27272a' : 'transparent',
                  color: taskScope === 'mine' ? '#ffffff' : '#71717a',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                My Tasks
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Calendar (7 cols), Right Upcoming Panels (5 cols) */}
      <div className="calendar-main-grid" style={{
        gap: 24,
        alignItems: 'start',
        width: '100%',
        minWidth: 0
      }}>
        {/* Calendar Card */}
        <div style={{
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(45px) saturate(180%)',
          WebkitBackdropFilter: 'blur(45px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: 'clamp(12px, 3.5vw, 24px)',
          boxShadow: '0 16px 36px -12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          minWidth: 0,
          overflow: 'hidden',
          width: '100%'
        }}>
          {/* Calendar Month Navigation Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
                {monthName}
              </h2>
              <button
                type="button"
                onClick={goToToday}
                style={{
                  background: '#18181b',
                  border: '1px solid #2e2e33',
                  color: 'var(--text-muted, #a1a1aa)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: '#161618',
                  border: '1px solid #27272a',
                  color: 'var(--text-main)',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: '#161618',
                  border: '1px solid #27272a',
                  color: 'var(--text-main)',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 6,
            marginBottom: 8,
            textAlign: 'center',
            width: '100%',
            minWidth: 0
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted, #71717a)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '4px 0',
                minWidth: 0,
                overflow: 'hidden'
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 6,
            width: '100%',
            minWidth: 0
          }}>
            {/* Empty offset days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div 
                key={`offset-${i}`} 
                className="ceova-calendar-day-cell"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                  opacity: 0.3,
                  minWidth: 0,
                  overflow: 'hidden'
                }} 
              />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = formattedDate === new Date().toISOString().split('T')[0];
              const isSelected = formattedDate === selectedDateStr;
              const dayMeetings = meetingsByDate[formattedDate] || [];
              const dayTasks = tasksByDueDate[formattedDate] || [];
              const dayTimelines = getTasksOnTimeline(formattedDate);

              // Items to display based on calendarFilter
              const itemsToShow: Array<{ type: 'meeting' | 'task'; data: any }> = [];
              if (calendarFilter !== 'tasks') {
                dayMeetings.forEach(m => itemsToShow.push({ type: 'meeting', data: m }));
              }
              if (calendarFilter !== 'meetings') {
                dayTasks.forEach(t => itemsToShow.push({ type: 'task', data: t }));
              }

              return (
                <div
                  key={formattedDate}
                  onClick={() => handleSelectDate(formattedDate)}
                  className="ceova-calendar-day-cell"
                  style={{
                    minWidth: 0,
                    overflow: 'hidden',
                    background: isSelected 
                      ? '#18181b' 
                      : isToday 
                        ? '#141416' 
                        : '#0d0d0f',
                    border: isSelected 
                      ? '1px solid #ffffff' 
                      : isToday 
                        ? '1px solid #3f3f46' 
                        : '1px solid #27272a',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  {/* Day Header Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minWidth: 0,
                    width: '100%'
                  }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: isToday ? 700 : (isSelected ? 700 : 500),
                      color: isToday ? '#ffffff' : (isSelected ? '#ffffff' : '#a1a1aa'),
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: isToday 
                        ? '#27272a' 
                        : (isSelected ? '#27272a' : 'transparent'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {dayNum}
                    </span>

                    {/* Count Badges (Desktop) */}
                    <div className="ceova-calendar-day-badges-text" style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      {dayMeetings.length > 0 && calendarFilter !== 'tasks' && (
                        <span title={`${dayMeetings.length} meeting(s)`} style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: '#1e293b',
                          border: '1px solid #334155',
                          color: '#60a5fa'
                        }}>
                          {dayMeetings.length}m
                        </span>
                      )}

                      {dayTasks.length > 0 && calendarFilter !== 'meetings' && (
                        <span title={`${dayTasks.length} task deadline(s)`} style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: '#272010',
                          border: '1px solid #78350f',
                          color: '#fbbf24'
                        }}>
                          {dayTasks.length}t
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dot Indicators for Mobile View */}
                  <div className="ceova-calendar-dot-indicators" style={{ alignItems: 'center', gap: 3, justifyContent: 'center', marginTop: 2 }}>
                    {dayMeetings.length > 0 && calendarFilter !== 'tasks' && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
                    )}
                    {dayTasks.length > 0 && calendarFilter !== 'meetings' && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', flexShrink: 0 }} />
                    )}
                    {dayTimelines.length > 0 && calendarFilter !== 'meetings' && dayMeetings.length === 0 && dayTasks.length === 0 && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7', flexShrink: 0 }} />
                    )}
                  </div>

                  {/* Day Items Container (Desktop Preview) */}
                  <div className="ceova-calendar-day-preview" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    gap: 3,
                    flex: 1,
                    minWidth: 0,
                    width: '100%',
                    marginTop: 5
                  }}>
                    {itemsToShow.length === 0 ? (
                      dayTimelines.length > 0 && calendarFilter !== 'meetings' ? (
                        <div
                          title={`${dayTimelines.length} ongoing task(s) active on timeline`}
                          style={{
                            height: 3,
                            borderRadius: 2,
                            background: '#7c3aed',
                            opacity: 0.6,
                            width: '100%',
                            marginBottom: 2
                          }}
                        />
                      ) : (
                        <div style={{ flex: 1 }} />
                      )
                    ) : itemsToShow.length === 1 ? (
                      (() => {
                        const item = itemsToShow[0];
                        if (item.type === 'meeting') {
                          const m = item.data as Meeting;
                          const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.general;
                          return (
                            <div
                              title={`Meeting: ${m.title} (${m.start_time})`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 5px',
                                borderRadius: 4,
                                background: cat.bg,
                                border: `1px solid ${cat.border}40`,
                                fontSize: 9.5,
                                fontWeight: 600,
                                color: cat.color,
                                minWidth: 0,
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: cat.color,
                                flexShrink: 0
                              }} />
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                flex: 1
                              }}>
                                {m.start_time} {m.title}
                              </span>
                            </div>
                          );
                        } else {
                          const t = item.data as Task;
                          const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                          return (
                            <div
                              title={`Deadline: ${t.title} (${t.priority} priority)`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '2px 5px',
                                borderRadius: 4,
                                background: prio.bg,
                                border: `1px solid ${prio.border}50`,
                                fontSize: 9.5,
                                fontWeight: 600,
                                color: prio.color,
                                minWidth: 0,
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <CheckSquare size={10} style={{ flexShrink: 0, color: prio.color }} />
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                flex: 1
                              }}>
                                {t.title}
                              </span>
                            </div>
                          );
                        }
                      })()
                    ) : itemsToShow.length === 2 ? (
                      itemsToShow.map((item, idx) => {
                        if (item.type === 'meeting') {
                          const m = item.data as Meeting;
                          const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.general;
                          return (
                            <div
                              key={`item-${idx}`}
                              title={`Meeting: ${m.title} (${m.start_time})`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '1px 4px',
                                borderRadius: 4,
                                background: cat.bg,
                                border: `1px solid ${cat.border}40`,
                                fontSize: 9,
                                fontWeight: 600,
                                color: cat.color,
                                minWidth: 0,
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {m.start_time}
                              </span>
                            </div>
                          );
                        } else {
                          const t = item.data as Task;
                          const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                          return (
                            <div
                              key={`item-${idx}`}
                              title={`Deadline: ${t.title}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '1px 4px',
                                borderRadius: 4,
                                background: prio.bg,
                                border: `1px solid ${prio.border}50`,
                                fontSize: 9,
                                fontWeight: 600,
                                color: prio.color,
                                minWidth: 0,
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              <CheckSquare size={9} style={{ flexShrink: 0, color: prio.color }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                {t.title}
                              </span>
                            </div>
                          );
                        }
                      })
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        {(() => {
                          const first = itemsToShow[0];
                          if (first.type === 'meeting') {
                            const m = first.data as Meeting;
                            const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.general;
                            return (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  background: cat.bg,
                                  color: cat.color,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {m.start_time} {m.title}
                                </span>
                              </div>
                            );
                          } else {
                            const t = first.data as Task;
                            const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                            return (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  padding: '1px 4px',
                                  borderRadius: 4,
                                  background: prio.bg,
                                  color: prio.color,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <CheckSquare size={9} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.title}
                                </span>
                              </div>
                            );
                          }
                        })()}
                        <div style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#a1a1aa',
                          background: '#18181b',
                          border: '1px solid #27272a',
                          padding: '1px 4px',
                          borderRadius: 4,
                          textAlign: 'center'
                        }}>
                          +{itemsToShow.length - 1} more items
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Date Events & Quick Actions (Side Popover) */}
        <div ref={sidePanelRef} style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, width: '100%' }}>
          {/* Selected Date Side Popover Card */}
          <div style={{
            background: '#121216',
            border: isSidePopOpen ? '1px solid #3b82f6' : '1px solid #27272a',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            minWidth: 0,
            width: '100%',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: '1px solid #27272a'
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#60a5fa',
                  letterSpacing: '0.06em',
                  marginBottom: 3
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                  <span>Selected Date Overview</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('default', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>

                {/* Counters Summary */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: selectedDateMeetings.length > 0 ? '#1e293b' : '#18181b',
                    color: selectedDateMeetings.length > 0 ? '#93c5fd' : '#71717a',
                    border: '1px solid #27272a'
                  }}>
                    <Video size={11} />
                    {selectedDateMeetings.length} Meeting{selectedDateMeetings.length === 1 ? '' : 's'}
                  </span>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    background: selectedDateTasks.length > 0 ? '#271e16' : '#18181b',
                    color: selectedDateTasks.length > 0 ? '#fbbf24' : '#71717a',
                    border: '1px solid #27272a'
                  }}>
                    <CheckSquare size={11} />
                    {selectedDateTasks.length} Deadline{selectedDateTasks.length === 1 ? '' : 's'}
                  </span>
                  {selectedDateTimelineTasks.length > 0 && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: '#1e1b4b',
                      color: '#a78bfa',
                      border: '1px solid #27272a'
                    }}>
                      <Layers size={11} />
                      {selectedDateTimelineTasks.length} on Timeline
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal(selectedDateStr)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#2563eb',
                      border: '1px solid #3b82f6',
                      color: '#ffffff',
                      padding: '7px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={14} /> Schedule Here
                  </button>
                )}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#18181b',
                      border: '1px solid #27272a',
                      color: '#a1a1aa',
                      padding: '7px 11px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Switch to Tasks Board"
                  >
                    <CheckSquare size={13} /> Tasks
                  </button>
                )}
              </div>
            </div>

            {/* If absolutely nothing on this date */}
            {selectedDateMeetings.length === 0 && selectedDateTasks.length === 0 && selectedDateTimelineTasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: '#71717a',
                fontSize: 13
              }}>
                <CalendarIcon size={32} style={{ opacity: 0.25, marginBottom: 10 }} />
                <div style={{ fontWeight: 600, color: '#e4e4e7', fontSize: 14 }}>
                  No meetings or task deadlines on this day
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: '#71717a', maxWidth: 280, margin: '4px auto 14px' }}>
                  Schedule a Google Meet briefing or jump over to the tasks board to assign new deliverables.
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => handleOpenScheduleModal(selectedDateStr)}
                      style={{
                        background: '#1d4ed8',
                        border: '1px solid #2563eb',
                        color: '#ffffff',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Schedule Meeting
                    </button>
                  )}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('tasks')}
                      style={{
                        background: '#18181b',
                        border: '1px solid #27272a',
                        color: '#d4d4d8',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Open Tasks Board
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 1. Meetings Section */}
                {selectedDateMeetings.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#60a5fa',
                      letterSpacing: '0.05em',
                      marginBottom: 10
                    }}>
                      <Video size={13} />
                      <span>Meetings & Video Calls ({selectedDateMeetings.length})</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedDateMeetings.map(m => {
                        const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.general;
                        const isCopied = copiedLinkMeetingId === m.id;

                        return (
                          <div
                            key={m.id}
                            style={{
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: 12,
                              padding: 14,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <div>
                                <span style={{
                                  display: 'inline-block',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 5,
                                  background: cat.bg,
                                  color: cat.color,
                                  border: `1px solid ${cat.border}40`,
                                  marginBottom: 6
                                }}>
                                  {cat.label}
                                </span>
                                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                                  {m.title}
                                </h4>
                              </div>

                              {/* Actions: Edit & Delete buttons */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                                {(isAdminUser || user?.id === m.created_by_id) && (
                                  <button
                                    type="button"
                                    title="Edit meeting session"
                                    onClick={() => handleOpenEditModal(m)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      background: '#27272a',
                                      border: '1px solid #3f3f46',
                                      color: '#93c5fd',
                                      padding: '5px 8px',
                                      borderRadius: 6,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Edit2 size={11} />
                                    <span>Edit</span>
                                  </button>
                                )}

                                {isAdminUser && (
                                  <button
                                    type="button"
                                    title="Cancel meeting"
                                    onClick={() => handleDeleteMeeting(m.id, m.title)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: '#27272a',
                                      border: '1px solid #ef444450',
                                      color: '#f87171',
                                      padding: '5px 7px',
                                      borderRadius: 6,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {m.description && (
                              <p style={{ margin: 0, fontSize: 12, color: '#a1a1aa', lineHeight: 1.4 }}>
                                {m.description}
                              </p>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#a1a1aa' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={12} />
                                <span>{m.start_time} ({m.duration_minutes}m)</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Users size={12} />
                                <span>
                                  {m.target_type === 'all' 
                                    ? 'Whole Team (All)' 
                                    : `${m.attendee_names?.length || 0} Member(s)`}
                                </span>
                              </div>
                            </div>

                            {/* Google Meet Launch Button & Copy Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                              <a
                                href={sanitizeUrl(m.meet_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  background: '#059669',
                                  border: '1px solid #10b981',
                                  color: '#ffffff',
                                  padding: '7px 12px',
                                  borderRadius: 7,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                <Video size={13} />
                                Join Google Meet
                                <ExternalLink size={12} style={{ opacity: 0.8 }} />
                              </a>

                              <button
                                type="button"
                                title="Copy Google Meet Link"
                                onClick={() => handleCopyMeetLink(m)}
                                style={{
                                  background: '#27272a',
                                  border: '1px solid #3f3f46',
                                  color: isCopied ? '#34d399' : '#a1a1aa',
                                  padding: '7px 10px',
                                  borderRadius: 7,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {isCopied ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Task Deadlines Section */}
                {selectedDateTasks.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#fbbf24',
                      letterSpacing: '0.05em',
                      marginBottom: 10
                    }}>
                      <CheckSquare size={13} />
                      <span>Task Deadlines Due Today ({selectedDateTasks.length})</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedDateTasks.map(t => {
                        const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                        const status = TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.todo;
                        const dueTime = formatTaskDueTime(t.due_date);

                        return (
                          <div
                            key={`task-${t.id}`}
                            style={{
                              background: '#18181b',
                              border: `1px solid #27272a`,
                              borderLeft: `3px solid ${prio.color}`,
                              borderRadius: 12,
                              padding: 14,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 9
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  background: prio.bg,
                                  color: prio.color,
                                  border: `1px solid ${prio.border}50`
                                }}>
                                  {prio.label} Priority
                                </span>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.border}40`
                                }}>
                                  {status.label}
                                </span>
                              </div>

                              <span style={{ fontSize: 11, fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={11} /> Due {dueTime}
                              </span>
                            </div>

                            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                              {t.title}
                            </h4>

                            {t.description && (
                              <p style={{
                                margin: 0,
                                fontSize: 12,
                                color: '#a1a1aa',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {t.description}
                              </p>
                            )}

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingTop: 8,
                              borderTop: '1px solid #27272a',
                              fontSize: 11,
                              color: '#a1a1aa'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <User size={12} style={{ color: '#71717a' }} />
                                <span>
                                  {t.assigned_to_name || (t.assigned_to_ids && t.assigned_to_ids.length > 0 ? `${t.assigned_to_ids.length} Assignees` : 'Unassigned')}
                                </span>
                              </div>

                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('tasks')}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#60a5fa',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '2px 4px'
                                  }}
                                >
                                  Open in Tasks <ArrowRight size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Active Tasks on Timeline Section */}
                {selectedDateTimelineTasks.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: '#a78bfa',
                      letterSpacing: '0.05em',
                      marginBottom: 10
                    }}>
                      <Layers size={13} />
                      <span>Active Tasks on Timeline ({selectedDateTimelineTasks.length})</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {selectedDateTimelineTasks.map(t => {
                        const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                        const status = TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.todo;
                        const start = parseTaskCreatedDate(t);
                        const end = parseTaskDueDate(t);

                        return (
                          <div
                            key={`timeline-${t.id}`}
                            style={{
                              background: '#18181b',
                              border: '1px solid #27272a',
                              borderLeft: '3px solid #7c3aed',
                              borderRadius: 12,
                              padding: 13,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: status.bg,
                                  color: status.color,
                                  border: `1px solid ${status.border}40`
                                }}>
                                  {status.label}
                                </span>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: 5,
                                  background: prio.bg,
                                  color: prio.color
                                }}>
                                  {prio.label}
                                </span>
                              </div>

                              <span style={{ fontSize: 10, fontWeight: 600, color: '#a78bfa' }}>
                                Timeline: {start} → {end}
                              </span>
                            </div>

                            <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                              {t.title}
                            </div>

                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: 11,
                              color: '#a1a1aa',
                              paddingTop: 6,
                              borderTop: '1px solid #27272a'
                            }}>
                              <span>{t.assigned_to_name ? `Assigned: ${t.assigned_to_name}` : 'Team Workspace'}</span>
                              {onNavigate && (
                                <button
                                  type="button"
                                  onClick={() => onNavigate('tasks')}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#c084fc',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}
                                >
                                  View on Board <ArrowRight size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upcoming Schedule & Pipeline Card */}
          <div style={{
            background: '#121216',
            border: '1px solid #27272a',
            borderRadius: 16,
            padding: 20,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            minWidth: 0,
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  Upcoming Pipeline & Schedule
                </h3>
                <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>
                  Synchronized meetings & upcoming task deadlines
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', background: '#18181b', padding: '3px 8px', borderRadius: 6, border: '1px solid #27272a' }}>
                {combinedUpcoming.length} items
              </span>
            </div>

            {/* Sub-Tabs: All | Meetings | Task Deadlines */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: 3,
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: 8,
              marginBottom: 12
            }}>
              <button
                type="button"
                onClick={() => setUpcomingTab('all')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: upcomingTab === 'all' ? '#27272a' : 'transparent',
                  color: upcomingTab === 'all' ? '#ffffff' : '#71717a',
                  transition: 'all 0.15s ease'
                }}
              >
                All ({upcomingMeetings.length + upcomingTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setUpcomingTab('meetings')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: upcomingTab === 'meetings' ? '#27272a' : 'transparent',
                  color: upcomingTab === 'meetings' ? '#60a5fa' : '#71717a',
                  transition: 'all 0.15s ease'
                }}
              >
                Meetings ({upcomingMeetings.length})
              </button>
              <button
                type="button"
                onClick={() => setUpcomingTab('tasks')}
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: upcomingTab === 'tasks' ? '#27272a' : 'transparent',
                  color: upcomingTab === 'tasks' ? '#fbbf24' : '#71717a',
                  transition: 'all 0.15s ease'
                }}
              >
                Deadlines ({upcomingTasks.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 420, overflowY: 'auto' }}>
              {combinedUpcoming.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#71717a', fontSize: 12 }}>
                  No upcoming items found in this category.
                </div>
              ) : (
                combinedUpcoming.map(item => {
                  if (item.type === 'meeting' && item.meeting) {
                    const m = item.meeting;
                    const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.general;
                    const isSelected = selectedDateStr === m.date;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDateStr(m.date)}
                        style={{
                          padding: 11,
                          borderRadius: 10,
                          background: isSelected ? '#1c1f2e' : '#18181b',
                          border: isSelected ? '1px solid #3b82f6' : '1px solid #27272a',
                          borderLeft: `3px solid ${cat.color}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: cat.color }}>
                            {m.date} • {m.start_time}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {(isAdminUser || user?.id === m.created_by_id) && (
                              <button
                                type="button"
                                title="Edit meeting"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(m);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#60a5fa',
                                  padding: 2,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <Edit2 size={11} />
                              </button>
                            )}
                            <a
                              href={sanitizeUrl(m.meet_link)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#34d399',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                textDecoration: 'none'
                              }}
                            >
                              Join <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.title}
                        </div>
                      </div>
                    );
                  } else if (item.type === 'task' && item.task) {
                    const t = item.task;
                    const prio = TASK_PRIORITY_CONFIG[t.priority] || TASK_PRIORITY_CONFIG.normal;
                    const status = TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.todo;
                    const isSelected = selectedDateStr === item.date;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDateStr(item.date)}
                        style={{
                          padding: 11,
                          borderRadius: 10,
                          background: isSelected ? '#252018' : '#18181b',
                          border: isSelected ? '1px solid #fbbf24' : '1px solid #27272a',
                          borderLeft: `3px solid ${prio.color}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckSquare size={10} /> {item.date} • {item.time}
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                            background: status.bg,
                            color: status.color,
                            border: `1px solid ${status.border}40`
                          }}>
                            {status.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: '#71717a' }}>
                          <span>{t.assigned_to_name || 'Team Task'}</span>
                          {onNavigate && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate('tasks');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60a5fa',
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              Board →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Add Meeting Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#111114',
            border: '1px solid #2a2a30',
            borderRadius: 18,
            width: '100%',
            maxWidth: 620,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid #222228',
              background: '#141418'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: editingMeetingId ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: editingMeetingId ? '#34d399' : '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {editingMeetingId ? <Edit2 size={18} /> : <Video size={18} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                    {editingMeetingId ? 'Edit Meeting Session' : 'Schedule Google Meet'}
                  </h3>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {editingMeetingId ? 'Update meeting agenda, time slot or attendees' : 'Admin Meeting Creation & Team Invitation'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMeetingId(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitMeeting} style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {formError && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontSize: 12
                }}>
                  {formError}
                </div>
              )}

              {/* Meeting Title */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                  Meeting Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Executive Sync & Product Review"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#18181c',
                    border: '1px solid #2e2e36',
                    color: '#ffffff',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Category & Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as MeetingCategory })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#18181c',
                      border: '1px solid #2e2e36',
                      color: '#ffffff',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="executive">Executive Sync</option>
                    <option value="standup">Daily Standup</option>
                    <option value="sprint">Sprint Planning</option>
                    <option value="review">Product Review</option>
                    <option value="general">General Meeting</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Duration (Minutes)
                  </label>
                  <select
                    value={formData.duration_minutes}
                    onChange={e => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#18181c',
                      border: '1px solid #2e2e36',
                      color: '#ffffff',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                  </select>
                </div>
              </div>

              {/* Date & Start Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Meeting Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#18181c',
                      border: '1px solid #2e2e36',
                      color: '#ffffff',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#18181c',
                      border: '1px solid #2e2e36',
                      color: '#ffffff',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Google Meet Link */}
              <div>
                <div style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
                    Google Meet Link *
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  value={formData.meet_link}
                  onChange={e => setFormData({ ...formData, meet_link: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#18181c',
                    border: '1px solid #2e2e36',
                    color: '#ffffff',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Attendee Selection (All vs Specific Members) */}
              <div style={{
                background: '#16161a',
                border: '1px solid #282830',
                borderRadius: 12,
                padding: 14
              }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                  Attendees & Target Audience
                </label>

                {/* Segmented Selector */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 12
                }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'all' })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: formData.target_type === 'all' ? '#2563eb' : '#1c1c20',
                      color: '#ffffff',
                      border: formData.target_type === 'all' ? '1px solid #3b82f6' : '1px solid #2d2d34',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Users size={14} /> All Members (Whole Team)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, target_type: 'members' })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: formData.target_type === 'members' ? '#2563eb' : '#1c1c20',
                      color: '#ffffff',
                      border: formData.target_type === 'members' ? '1px solid #3b82f6' : '1px solid #2d2d34',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <UserCheck size={14} /> Select Specific Members
                  </button>
                </div>

                {/* If specific members selected */}
                {formData.target_type === 'members' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        position: 'relative',
                        flex: 1
                      }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search members by name or department..."
                          value={memberSearchQuery}
                          onChange={e => setMemberSearchQuery(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            borderRadius: 6,
                            background: '#121215',
                            border: '1px solid #282830',
                            color: '#ffffff',
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSelectAllMembers}
                        style={{
                          background: '#222228',
                          border: '1px solid #33333d',
                          color: 'var(--text-main)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllMembers}
                        style={{
                          background: '#222228',
                          border: '1px solid #33333d',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        Clear
                      </button>
                    </div>

                    <div style={{
                      maxHeight: 180,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      border: '1px solid #222228',
                      borderRadius: 8,
                      padding: 6,
                      background: '#121215'
                    }}>
                      {filteredMembersList.map(m => {
                        const isSelected = formData.selected_attendee_ids.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleToggleAttendee(m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              borderRadius: 6,
                              background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                              border: isSelected ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: '#2563eb',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                overflow: 'hidden'
                              }}>
                                {m.avatar_url ? (
                                  <img src={m.avatar_url} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  m.full_name?.charAt(0) || 'U'
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>
                                  {m.full_name}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  {m.role.toUpperCase()} • {m.department}
                                </div>
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by row click
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Selected: <strong>{formData.selected_attendee_ids.length}</strong> of {members.length} members
                    </div>
                  </div>
                )}
              </div>

              {/* Agenda / Description */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-main)', marginBottom: 6 }}>
                  Meeting Agenda / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key agenda items, deliverables to review, or preparation needed..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#18181c',
                    border: '1px solid #2e2e36',
                    color: '#ffffff',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 12,
                marginTop: 8,
                paddingTop: 16,
                borderTop: '1px solid #222228'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMeetingId(null);
                  }}
                  style={{
                    background: '#18181c',
                    border: '1px solid #2e2e36',
                    color: 'var(--text-muted)',
                    padding: '10px 18px',
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: editingMeetingId 
                      ? 'linear-gradient(135deg, #059669, #047857)' 
                      : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '10px 22px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: editingMeetingId 
                      ? '0 4px 14px rgba(5, 150, 105, 0.4)' 
                      : '0 4px 14px rgba(37, 99, 235, 0.4)'
                  }}
                >
                  {editingMeetingId ? <Check size={16} /> : <Video size={16} />}
                  {isSubmitting 
                    ? (editingMeetingId ? 'Saving...' : 'Scheduling...') 
                    : (editingMeetingId ? 'Save Changes' : 'Schedule & Notify Team')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
