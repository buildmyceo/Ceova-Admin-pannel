import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortalData } from '../../context/PortalDataContext';
import { 
  Building2, 
  Database, 
  ShieldCheck, 
  Sparkles,
  Crown,
  User,
  Camera,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
  Plus,
  Key,
  X,
  CreditCard,
  Users,
  DollarSign,
  Settings,
  Calendar,
  Clock,
  Video,
  CheckSquare,
  Copy,
  Check,
  Briefcase,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Paperclip,
  Bell,
  ShieldAlert,
  PauseCircle
} from 'lucide-react';
import { NavTab } from '../../components/Sidebar';
import { Task, TaskPriority, TaskStatus, Meeting, MeetingCategory, Profile } from '../../types';
import { MemberStatusModal } from '../../components/MemberStatusModal';
import { getVisibleMeetings } from '../../lib/meetingsService';
import { sanitizeUrl } from '../../lib/security';

const TASKS_STORAGE_KEY = 'ceova_local_tasks_cache_v2';

const CATEGORY_CONFIG: Record<MeetingCategory, { label: string; color: string; bg: string; border: string }> = {
  executive: { label: 'Executive Briefing', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
  standup: { label: 'Team Standup', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
  review: { label: 'Deliverable Review', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
  sprint: { label: 'Sprint Planning', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6' },
  general: { label: 'Team Sync', color: '#e4e4e7', bg: 'rgba(255, 255, 255, 0.08)', border: '#71717a' }
};

interface CEODashboardViewProps {
  onNavigate: (tab: NavTab, id?: string) => void;
  onOpenTaskModal?: () => void;
  onOpenAnnouncementModal?: () => void;
}

export const CEODashboardView: React.FC<CEODashboardViewProps> = ({
  onNavigate,
}) => {
  const { user, role, isSupabaseConfigured } = useAuth();
  const { departments, members } = usePortalData();


  // Member tasks & meetings state
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const raw = localStorage.getItem(TASKS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    return getVisibleMeetings(user);
  });

  const [copiedMeetId, setCopiedMeetId] = useState<string | null>(null);
  const [taskViewTab, setTaskViewTab] = useState<'assigned' | 'given'>('assigned');

  const isAdmin = role === 'admin' || role === 'ceo';
  const [statusModalMember, setStatusModalMember] = useState<Profile | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);



  // Load latest tasks & meetings and listen for real-time changes
  useEffect(() => {
    const syncMeetings = () => {
      setMeetings(getVisibleMeetings(user));
    };

    const syncTasks = async () => {
      try {
        const { getSupabaseClient } = await import('../../lib/supabase');
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });
          if (data && Array.isArray(data)) {
            setTasks(data as Task[]);
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch {
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem(TASKS_STORAGE_KEY);
          if (raw) setTasks(JSON.parse(raw));
        } catch {}
      }
    };

    syncMeetings();
    syncTasks();

    window.addEventListener('ceova_meetings_updated', syncMeetings);
    window.addEventListener('storage', syncTasks);

    return () => {
      window.removeEventListener('ceova_meetings_updated', syncMeetings);
      window.removeEventListener('storage', syncTasks);
    };
  }, [user]);

  // Handle Copy Meet Link
  const handleCopyLink = (meet: Meeting) => {
    if (!meet.meet_link) return;
    navigator.clipboard.writeText(meet.meet_link);
    setCopiedMeetId(meet.id);
    setTimeout(() => setCopiedMeetId(null), 2000);
  };

  // Helper date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Filter today's meetings (or upcoming if none today)
  const todayMeetings = useMemo(() => {
    return meetings.filter(m => m.date === todayStr);
  }, [meetings, todayStr]);

  const upcomingMeetings = useMemo(() => {
    return meetings.filter(m => m.date >= todayStr).slice(0, 5);
  }, [meetings, todayStr]);

  // Tasks assigned to this user
  const myAssignedTasks = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => 
      t.assigned_to_id === user.id ||
      (t.assigned_to_ids && t.assigned_to_ids.includes(user.id)) ||
      (t.assigned_to_name && user.full_name && t.assigned_to_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
    );
  }, [tasks, user]);

  // Tasks given / created by this user
  const tasksGivenByMe = useMemo(() => {
    if (!user) return [];
    return tasks.filter(t => 
      t.assigned_by_id === user.id ||
      (t.assigned_by_name && user.full_name && t.assigned_by_name.trim().toLowerCase() === user.full_name.trim().toLowerCase())
    );
  }, [tasks, user]);

  const pendingAssignedCount = useMemo(() => {
    return myAssignedTasks.filter(t => t.status !== 'completed').length;
  }, [myAssignedTasks]);

  const completedDeliverablesCount = useMemo(() => {
    return myAssignedTasks.filter(t => t.status === 'completed').length;
  }, [myAssignedTasks]);

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent': return { label: 'Urgent', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'high': return { label: 'High', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'low': return { label: 'Low', bg: 'rgba(255, 255, 255, 0.05)', color: '#a1a1aa', border: 'rgba(255, 255, 255, 0.1)' };
      case 'normal':
      default: return { label: 'Normal', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  const getStatusBadge = (s: TaskStatus) => {
    switch (s) {
      case 'completed': return { label: 'Completed', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'review': return { label: 'Under Review', color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)' };
      case 'in_progress': return { label: 'In Progress', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'todo':
      default: return { label: 'To Do', color: '#e4e4e7', bg: 'rgba(255, 255, 255, 0.06)', border: 'rgba(255, 255, 255, 0.12)' };
    }
  };

  return (
    <div className="view-container">


      {/* 2. USER PROFILE & IDENTITY BANNER (GLASSMORPHISM) */}
      <div 
        className="bento-card dashboard-banner-card" 
        style={{ 
          padding: '24px 28px', 
          marginBottom: 24,
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
          border: '1px solid rgba(255, 255, 255, 0.11)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        }}
      >
        <div className="dashboard-banner-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          {/* Left: Avatar & Identity Details */}
          <div className="dashboard-banner-identity" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* User Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: '#18181c',
                border: '2px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#ffffff' }}>
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {/* Online Dot */}
              <span style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#22c55e',
                border: '2px solid #0a0d14'
              }} />
            </div>

            {/* Name, Designation, Role Badges */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                  {user?.full_name || 'Team Member'}
                </h1>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: role === 'ceo' 
                    ? 'rgba(56, 189, 248, 0.15)' 
                    : role === 'admin' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : role === 'intern' 
                        ? 'rgba(245, 158, 11, 0.15)' 
                        : 'rgba(59, 130, 246, 0.15)',
                  border: role === 'ceo' 
                    ? '1px solid rgba(56, 189, 248, 0.3)' 
                    : role === 'admin' 
                      ? '1px solid rgba(255, 255, 255, 0.22)' 
                      : role === 'intern' 
                        ? '1px solid rgba(245, 158, 11, 0.3)' 
                        : '1px solid rgba(59, 130, 246, 0.3)',
                  color: role === 'ceo' 
                    ? '#38bdf8' 
                    : role === 'admin' 
                      ? '#ffffff' 
                      : role === 'intern' 
                        ? '#fbbf24' 
                        : '#60a5fa',
                  textTransform: 'uppercase'
                }}>
                  <ShieldCheck size={11} />
                  {role ? role.toUpperCase() : 'MEMBER'}
                </span>

                <span style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)'
                }}>
                  {user?.role === 'intern' && (!user?.department || user.department === 'General') ? 'Internship' : (user?.department || 'General')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={14} style={{ color: 'var(--text-subtle)' }} />
                  <span style={{ color: '#e4e4e7' }}>
                    {user?.role === 'intern' 
                      ? (user?.designation && user.designation !== 'Team Member' ? user.designation : 'Intern') 
                      : (user?.designation || 'Member')}
                  </span>
                </div>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={13} style={{ color: 'var(--text-subtle)' }} />
                  <span>{todayFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK STATS SUMMARY KPI CARDS (4 TILES) */}
      <div className="dashboard-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 14, marginBottom: 24 }}>
        {/* Today's Meetings */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('calendar')}>
          <div>
            <div className="stat-info">
              <span className="title">Today's Meetings</span>
              <div className="value" style={{ color: '#38bdf8' }}>{todayMeetings.length}</div>
              <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: todayMeetings.length > 0 ? '#22c55e' : '#71717a' }} />
                <span>{todayMeetings.length > 0 ? `${todayMeetings.length} scheduled today` : 'No meetings today'}</span>
              </div>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Video size={18} />
          </div>
        </div>

        {/* Assigned Tasks Pending */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('tasks', 'mine')}>
          <div>
            <div className="stat-info">
              <span className="title">Tasks Assigned to Me</span>
              <div className="value" style={{ color: '#60a5fa' }}>{pendingAssignedCount}</div>
              <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: pendingAssignedCount > 0 ? '#3b82f6' : '#22c55e' }} />
                <span>{pendingAssignedCount > 0 ? 'Pending deliverables' : 'All tasks cleared'}</span>
              </div>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
            <CheckSquare size={18} />
          </div>
        </div>

        {/* Tasks Given / Delegated by Me */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('tasks', 'delegated')}>
          <div>
            <div className="stat-info">
              <span className="title">Tasks Given by Me</span>
              <div className="value" style={{ color: '#c084fc' }}>{tasksGivenByMe.length}</div>
              <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7' }} />
                <span>Tasks delegated to members</span>
              </div>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
            <Users size={18} />
          </div>
        </div>

        {/* Completed Deliverables */}
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('saved')}>
          <div>
            <div className="stat-info">
              <span className="title">Completed Tasks</span>
              <div className="value" style={{ color: '#4ade80' }}>{completedDeliverablesCount}</div>
              <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span>Finished deliverables</span>
              </div>
            </div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>
      </div>

      {/* 4. MAIN DUAL SECTION: LEFT TODAY'S MEETINGS, RIGHT TODAY'S TASKS */}
      <div 
        className="dashboard-dual-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 20,
          alignItems: 'start'
        }}
      >
        {/* =========================================================================
            LEFT COLUMN: TODAY'S MEETINGS & CONFERENCES (GOOGLE MEET)
            ========================================================================= */}
        <div 
          className="bento-card" 
          style={{ 
            padding: 24,
            background: 'rgba(12, 16, 26, 0.55)',
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            border: '1px solid rgba(255, 255, 255, 0.11)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}>
                <Video size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Today's Meetings
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {todayMeetings.length} video conferences for today
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Full Calendar <ArrowRight size={13} />
            </button>
          </div>

          {/* Meetings List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayMeetings.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                color: 'var(--text-muted)'
              }}>
                <Video size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
                  No Meetings Scheduled for Today
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
                  You have no pending video conferences today. You have quiet focus time!
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View Full Schedule
                </button>
              </div>
            ) : (
              todayMeetings.map(meet => {
                const cat = CATEGORY_CONFIG[meet.category] || CATEGORY_CONFIG.general;
                const isCopied = copiedMeetId === meet.id;

                return (
                  <div
                    key={meet.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.035)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 14,
                      padding: '16px 18px',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: cat.bg,
                            color: cat.color,
                            border: `1px solid ${cat.border}40`,
                            textTransform: 'uppercase'
                          }}>
                            {cat.label}
                          </span>

                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: '#60a5fa',
                            fontWeight: 600
                          }}>
                            <Clock size={12} />
                            {meet.start_time} ({meet.duration_minutes} min)
                          </span>
                        </div>

                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ffffff' }}>
                          {meet.title}
                        </h4>
                      </div>
                    </div>

                    {meet.description && (
                      <p style={{ margin: '0 0 12px 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {meet.description}
                      </p>
                    )}

                    {/* Actions: Join Google Meet + Copy Link */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Users size={12} />
                        <span>{meet.target_type === 'all' ? 'All Team Members' : (meet.attendee_names?.join(', ') || 'Invited')}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(meet)}
                          title="Copy Google Meet URL"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: isCopied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: isCopied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: isCopied ? '#34d399' : 'var(--text-muted)',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <a
                          href={sanitizeUrl(meet.meet_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 6,
                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                          }}
                        >
                          <Video size={13} />
                          Join Google Meet
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Upcoming meetings preview if fewer than 2 today */}
            {todayMeetings.length < 2 && upcomingMeetings.filter(m => m.date > todayStr).length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Coming Up Next
                </div>
                {upcomingMeetings.filter(m => m.date > todayStr).slice(0, 2).map(m => (
                  <div 
                    key={m.id}
                    onClick={() => onNavigate('calendar')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      marginBottom: 6,
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.date} at {m.start_time}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-subtle)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: TODAY'S TASKS & DELEGATED TASKS
            ========================================================================= */}
        <div 
          className="bento-card" 
          style={{ 
            padding: 24,
            background: 'rgba(12, 16, 26, 0.55)',
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            border: '1px solid rgba(255, 255, 255, 0.11)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Header with Switch Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Work & Deliverables
              </h3>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Track tasks assigned to you or delegated to members
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All Tasks <ArrowRight size={13} />
            </button>
          </div>

          {/* Toggle Pills: Assigned To Me vs Tasks Given By Me */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: 4,
            borderRadius: 10,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 16
          }}>
            <button
              type="button"
              onClick={() => setTaskViewTab('assigned')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 8,
                border: 'none',
                background: taskViewTab === 'assigned' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: taskViewTab === 'assigned' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Assigned to Me ({myAssignedTasks.length})
            </button>

            <button
              type="button"
              onClick={() => setTaskViewTab('given')}
              style={{
                flex: 1,
                padding: '7px 12px',
                borderRadius: 8,
                border: 'none',
                background: taskViewTab === 'given' ? 'rgba(168, 85, 247, 0.25)' : 'transparent',
                color: taskViewTab === 'given' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Given by Me ({tasksGivenByMe.length})
            </button>
          </div>

          {/* Task Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taskViewTab === 'assigned' ? (
              myAssignedTasks.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  color: 'var(--text-muted)'
                }}>
                  <CheckSquare size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
                    No Tasks Assigned to You
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
                    You currently have no tasks assigned to your queue.
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Open Tasks Board
                  </button>
                </div>
              ) : (
                myAssignedTasks.slice(0, 5).map(task => {
                  const pBadge = getPriorityBadge(task.priority);
                  const sBadge = getStatusBadge(task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: pBadge.bg,
                            color: pBadge.color,
                            border: `1px solid ${pBadge.border}`
                          }}>
                            {pBadge.label}
                          </span>

                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: sBadge.bg,
                            color: sBadge.color,
                            border: `1px solid ${sBadge.border}`
                          }}>
                            {sBadge.label}
                          </span>
                        </div>

                        {task.due_date && (
                          <div style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            <span>Due: {task.due_date}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
                        {task.title}
                      </div>

                      {task.assigned_by_name && (
                        <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                          Given by: <strong style={{ color: '#e4e4e7' }}>{task.assigned_by_name}</strong>
                        </div>
                      )}
                    </div>
                  );
                })
              )
            ) : (
              /* TASKS GIVEN / DELEGATED BY ME */
              tasksGivenByMe.length === 0 ? (
                <div style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  color: 'var(--text-muted)'
                }}>
                  <Users size={32} style={{ opacity: 0.3, margin: '0 auto 10px' }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
                    No Tasks Delegated Yet
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginBottom: 16 }}>
                    You haven't assigned any deliverables to team members yet.
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#ffffff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Assign a Task
                  </button>
                </div>
              ) : (
                tasksGivenByMe.slice(0, 5).map(task => {
                  const pBadge = getPriorityBadge(task.priority);
                  const sBadge = getStatusBadge(task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: 12,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: pBadge.bg,
                            color: pBadge.color,
                            border: `1px solid ${pBadge.border}`
                          }}>
                            {pBadge.label}
                          </span>

                          <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: 4,
                            background: sBadge.bg,
                            color: sBadge.color,
                            border: `1px solid ${sBadge.border}`
                          }}>
                            {sBadge.label}
                          </span>
                        </div>

                        {task.due_date && (
                          <div style={{ fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} />
                            <span>Due: {task.due_date}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
                        {task.title}
                      </div>

                      <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
                        Given to: <strong style={{ color: '#60a5fa' }}>{task.assigned_to_name || 'Team Member'}</strong>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ADMIN/CEO TEAM ACCESS & ACCOUNT SECURITY CONTROLS
          ========================================================================= */}
      {isAdmin && (
        <div
          className="bento-card"
          style={{
            marginTop: 24,
            padding: 'clamp(14px, 3.5vw, 24px)',
            background: 'rgba(12, 16, 26, 0.55)',
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            border: '1px solid rgba(255, 255, 255, 0.11)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171'
              }}>
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Team Access &amp; Security Control
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Pause or block member workspace access. Suspended users will immediately see a restriction notice with instructions to contact you.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('members')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e4e4e7',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>View Full Directory</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="ceova-security-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: 14
          }}>
            {members.map((m) => {
              const isSelf = user?.id === m.id || (user?.email && m.email && user.email.toLowerCase() === m.email.toLowerCase());
              const isPaused = m.status === 'paused';
              const isBlocked = m.status === 'blocked';
              const isSuspended = isPaused || isBlocked;

              return (
                <div
                  key={m.id}
                  style={{
                    background: isSuspended ? 'rgba(30, 15, 15, 0.45)' : '#12141a',
                    border: isSuspended ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #27272a',
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: '#27272a',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      border: isSuspended ? '2px solid #ef4444' : '1px solid #3f3f46'
                    }}>
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                          {(m.full_name || 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.full_name}
                        </span>
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: m.role === 'ceo' 
                            ? 'rgba(56, 189, 248, 0.15)' 
                            : m.role === 'admin' 
                              ? 'rgba(255, 255, 255, 0.12)' 
                              : m.role === 'intern' 
                                ? 'rgba(245, 158, 11, 0.18)' 
                                : 'rgba(59, 130, 246, 0.12)',
                          color: m.role === 'ceo' 
                            ? '#38bdf8' 
                            : m.role === 'admin' 
                              ? '#ffffff' 
                              : m.role === 'intern' 
                                ? '#fbbf24' 
                                : '#60a5fa',
                          border: m.role === 'intern' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
                        }}>
                          {m.role || 'member'}
                        </span>
                        {isSelf && (
                          <span style={{ fontSize: 9.5, padding: '1px 6px', borderRadius: 4, background: '#27272a', color: '#a1a1aa' }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.email}
                      </div>
                    </div>

                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: isBlocked ? '#450a0a' : isPaused ? '#451a03' : '#052e16',
                      color: isBlocked ? '#f87171' : isPaused ? '#fbbf24' : '#4ade80',
                      border: isBlocked ? '1px solid #7f1d1d' : isPaused ? '1px solid #78350f' : '1px solid #14532d',
                      flexShrink: 0
                    }}>
                      {m.status || 'Active'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#a1a1aa', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.role === 'intern' 
                        ? (m.designation && m.designation !== 'Team Member' ? m.designation : 'Intern') 
                        : (m.designation || 'Team Member')} • {m.role === 'intern' && (!m.department || m.department === 'General') ? 'Internship' : (m.department || 'General')}
                    </span>

                    {!isSelf ? (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusModalMember(m);
                          setIsStatusModalOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 12px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                          background: isSuspended ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          border: isSuspended ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                          color: isSuspended ? '#4ade80' : '#f87171',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        {isSuspended ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Reactivate Access</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={12} />
                            <span>Pause / Block</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#71717a', fontStyle: 'italic' }}>
                        Primary Administrator
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MemberStatusModal
        isOpen={isStatusModalOpen}
        member={statusModalMember}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusModalMember(null);
        }}
      />
    </div>
  );
};
