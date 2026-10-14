import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClipboardCheck, 
  UserCheck, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronRight, 
  BarChart3,
  Award,
  CalendarCheck
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';
import { Meeting, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { getVisibleMeetings, fetchMeetingsFromSupabase } from '../lib/meetingsService';
import { MarkAttendanceModal } from '../components/MarkAttendanceModal';
import { UserAvatar } from '../components/UserAvatar';

interface AttendanceViewProps {
  onNavigate: (tab: NavTab, id?: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const { members, departments } = usePortalData();

  const [meetings, setMeetings] = useState<Meeting[]>(() => getVisibleMeetings(user));
  const [activeTab, setActiveTab] = useState<'my_attendance' | 'manage_meetings' | 'team_roster'>('my_attendance');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attended' | 'absent' | 'pending'>('all');

  const isLeaderOrAdmin = Boolean(
    isAdmin || user?.role === 'ceo' || user?.role === 'admin'
  );

  // Sync latest meetings from Supabase & storage
  const reloadMeetings = useCallback(async () => {
    setMeetings(getVisibleMeetings(user));
    try {
      const fresh = await fetchMeetingsFromSupabase(user);
      if (fresh) setMeetings(fresh);
    } catch (err) {
      console.warn('Failed refreshing meetings for attendance view:', err);
    }
  }, [user]);

  useEffect(() => {
    reloadMeetings();
    const handleUpdate = () => reloadMeetings();
    window.addEventListener('ceova_meetings_updated', handleUpdate);
    return () => window.removeEventListener('ceova_meetings_updated', handleUpdate);
  }, [reloadMeetings]);

  // Meetings relevant to current user (invited or whole workspace)
  const myMeetings = useMemo(() => {
    if (!user) return [];
    const uid = (user.id || '').toLowerCase().trim();
    const uname = (user.full_name || '').toLowerCase().trim();
    const uemail = (user.email || '').toLowerCase().trim();

    return meetings.filter(m => {
      if (m.target_type === 'all') return true;
      if (m.created_by_id?.toLowerCase().trim() === uid) return true;
      if (m.attendee_ids && m.attendee_ids.some(id => id.toLowerCase().trim() === uid)) return true;
      if (m.attendee_names && m.attendee_names.some(name => {
        const n = name.toLowerCase().trim();
        return n === uname || (uemail && n.includes(uemail));
      })) return true;
      return false;
    }).sort((a, b) => new Date(`${b.date}T${b.start_time || '00:00'}`).getTime() - new Date(`${a.date}T${a.start_time || '00:00'}`).getTime());
  }, [meetings, user]);

  // Compute personal attendance statistics
  const personalStats = useMemo(() => {
    let totalInvited = 0;
    let attended = 0;
    let absent = 0;
    let pending = 0;

    if (!user) return { totalInvited, attended, absent, pending, rate: 0 };

    myMeetings.forEach(m => {
      // If attendance was recorded
      if (m.attendance && m.attendance.records) {
        totalInvited++;
        const rec = m.attendance.records.find(r => 
          r.user_id === user.id || 
          r.user_email?.toLowerCase() === user.email?.toLowerCase() ||
          r.user_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
        );
        if (rec) {
          if (rec.status === 'present' || rec.status === 'late') {
            attended++;
          } else if (rec.status === 'absent') {
            absent++;
          }
        } else {
          // If in an all-hands meeting without individual entry
          attended++;
        }
      } else {
        pending++;
      }
    });

    const rate = totalInvited > 0 ? Math.round((attended / totalInvited) * 100) : 100;
    return { totalInvited, attended, absent, pending, rate };
  }, [myMeetings, user]);

  // Meetings hosted by current user
  const hostedMeetings = useMemo(() => {
    if (!user) return [];
    return meetings.filter(m => 
      m.created_by_id === user.id || 
      m.created_by_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
    );
  }, [meetings, user]);

  // Meetings pending host attendance marking
  const pendingHostedAttendance = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return hostedMeetings.filter(m => !m.attendance && m.date <= todayStr);
  }, [hostedMeetings]);

  // Team roster overall stats
  const teamRosterStats = useMemo(() => {
    const memberMap = new Map<string, {
      profile: Profile;
      totalInvited: number;
      attended: number;
      absent: number;
      rate: number;
    }>();

    members.forEach(m => {
      memberMap.set(m.id, {
        profile: m,
        totalInvited: 0,
        attended: 0,
        absent: 0,
        rate: 100
      });
    });

    meetings.forEach(m => {
      if (m.attendance && m.attendance.records) {
        m.attendance.records.forEach(r => {
          const entry = memberMap.get(r.user_id) || Array.from(memberMap.values()).find(e => 
            e.profile.full_name.toLowerCase().trim() === r.user_name.toLowerCase().trim()
          );

          if (entry) {
            entry.totalInvited++;
            if (r.status === 'present' || r.status === 'late') {
              entry.attended++;
            } else if (r.status === 'absent') {
              entry.absent++;
            }
          }
        });
      }
    });

    return Array.from(memberMap.values()).map(e => ({
      ...e,
      rate: e.totalInvited > 0 ? Math.round((e.attended / e.totalInvited) * 100) : 100
    })).sort((a, b) => b.rate - a.rate || b.attended - a.attended);
  }, [members, meetings]);

  const handleOpenAttendance = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsAttendanceModalOpen(true);
  };

  return (
    <div className="portal-content-container" style={{ padding: '24px 32px 64px', maxWidth: 1400, margin: '0 auto' }}>
      {/* View Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <CalendarCheck size={20} />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em'
            }}>
              Attendance Hub
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#94a3b8' }}>
            Meeting attendance tracking, automated roster updates, and individual participation records.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => onNavigate('calendar')}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: 'none',
              color: '#ffffff',
              padding: '9px 16px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}
          >
            <Calendar size={15} />
            View Full Calendar
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {/* Personal Attendance Rate */}
        <div style={{
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
              My Attendance Rate
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
              {personalStats.rate}%
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: personalStats.rate >= 85 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: personalStats.rate >= 85 ? '#34d399' : '#fbbf24'
            }}>
              {personalStats.rate >= 85 ? 'Excellent' : 'Needs Focus'}
            </span>
          </div>
          <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${personalStats.rate}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: 99,
              transition: 'width 0.6s ease'
            }} />
          </div>
        </div>

        {/* Meetings Attended */}
        <div style={{
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
              Meetings Attended
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {personalStats.attended} <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>/ {personalStats.totalInvited}</span>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Confirmed participation across team syncs
          </div>
        </div>

        {/* Missed / Absent */}
        <div style={{
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
              Meetings Missed
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: personalStats.absent > 0 ? '#ef4444' : '#ffffff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {personalStats.absent}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {personalStats.absent === 0 ? 'Spotless record — zero absences!' : 'Recorded absent by meeting host'}
          </div>
        </div>

        {/* Host Action Banner / Pending */}
        <div style={{
          background: pendingHostedAttendance.length > 0 
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)' 
            : 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: pendingHostedAttendance.length > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: pendingHostedAttendance.length > 0 ? '#fbbf24' : '#94a3b8', letterSpacing: '0.05em' }}>
              Host Duty: Pending Rosters
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: pendingHostedAttendance.length > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: pendingHostedAttendance.length > 0 ? '#fbbf24' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: pendingHostedAttendance.length > 0 ? '#fbbf24' : '#ffffff', letterSpacing: '-0.03em', marginBottom: 4 }}>
            {pendingHostedAttendance.length}
          </div>
          <div style={{ fontSize: 12, color: pendingHostedAttendance.length > 0 ? '#fbbf24' : '#94a3b8' }}>
            {pendingHostedAttendance.length > 0 
              ? 'Concluded meetings awaiting your attendance mark' 
              : 'All your hosted meetings have finalized attendance'}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: 20,
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setActiveTab('my_attendance')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'my_attendance' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'my_attendance' ? '#ffffff' : '#94a3b8',
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <UserCheck size={16} />
            My Attendance Record ({myMeetings.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manage_meetings')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'manage_meetings' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'manage_meetings' ? '#ffffff' : '#94a3b8',
              padding: '10px 16px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s ease'
            }}
          >
            <ClipboardCheck size={16} />
            Meetings Attendance Manager ({meetings.length})
            {pendingHostedAttendance.length > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#000',
                fontSize: 10.5,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 8
              }}>
                {pendingHostedAttendance.length}
              </span>
            )}
          </button>

          {isLeaderOrAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('team_roster')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'team_roster' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'team_roster' ? '#ffffff' : '#94a3b8',
                padding: '10px 16px',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease'
              }}
            >
              <BarChart3 size={16} />
              Team Leaderboard &amp; Roster
            </button>
          )}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder={activeTab === 'team_roster' ? "Search member..." : "Search meetings..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 8,
              padding: '7px 12px 7px 34px',
              fontSize: 12,
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MY ATTENDANCE RECORD
          ========================================================================= */}
      {activeTab === 'my_attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {(['all', 'attended', 'absent', 'pending'] as const).map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: statusFilter === st ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: statusFilter === st ? '#60a5fa' : '#94a3b8',
                  padding: '5px 14px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {st === 'all' ? 'All My Meetings' : st === 'attended' ? 'Attended (Present / Late)' : st === 'absent' ? 'Missed (Absent)' : 'Awaiting Review'}
              </button>
            ))}
          </div>

          {myMeetings
            .filter(m => {
              if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchSearch = m.title.toLowerCase().includes(q) || m.created_by_name?.toLowerCase().includes(q);
                if (!matchSearch) return false;
              }
              if (statusFilter !== 'all') {
                const hasAttendance = Boolean(m.attendance);
                const rec = m.attendance?.records?.find(r => 
                  r.user_id === user?.id || 
                  r.user_email?.toLowerCase() === user?.email?.toLowerCase() ||
                  r.user_name?.toLowerCase().trim() === user?.full_name?.toLowerCase().trim()
                );
                if (statusFilter === 'attended') {
                  if (!hasAttendance || (rec?.status !== 'present' && rec?.status !== 'late')) return false;
                } else if (statusFilter === 'absent') {
                  if (!hasAttendance || rec?.status !== 'absent') return false;
                } else if (statusFilter === 'pending') {
                  if (hasAttendance) return false;
                }
              }
              return true;
            })
            .map(m => {
              // Find user's attendance record in this meeting
              const rec = m.attendance?.records?.find(r => 
                r.user_id === user?.id || 
                r.user_email?.toLowerCase() === user?.email?.toLowerCase() ||
                r.user_name?.toLowerCase().trim() === user?.full_name?.toLowerCase().trim()
              );

              const hasAttendance = Boolean(m.attendance);
              const isPresent = rec?.status === 'present';
              const isLate = rec?.status === 'late';
              const isAbsent = rec?.status === 'absent';
              const isHost = m.created_by_id === user?.id;

              return (
                <div
                  key={m.id}
                  style={{
                    background: 'rgba(12, 16, 26, 0.55)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: hasAttendance 
                        ? (isPresent ? 'rgba(16, 185, 129, 0.15)' : isLate ? 'rgba(245, 158, 11, 0.15)' : isAbsent ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)')
                        : 'rgba(255, 255, 255, 0.04)',
                      border: hasAttendance
                        ? (isPresent ? '1px solid rgba(16, 185, 129, 0.3)' : isLate ? '1px solid rgba(245, 158, 11, 0.3)' : isAbsent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)')
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: hasAttendance
                        ? (isPresent ? '#34d399' : isLate ? '#fbbf24' : isAbsent ? '#f87171' : '#94a3b8')
                        : '#94a3b8'
                    }}>
                      {hasAttendance ? (
                        isPresent ? <CheckCircle2 size={22} /> : isLate ? <Clock size={22} /> : <XCircle size={22} />
                      ) : (
                        <Calendar size={20} />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                          {m.title}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#94a3b8'
                        }}>
                          {m.category}
                        </span>
                        {isHost && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(59, 130, 246, 0.18)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                          }}>
                            Hosted by You
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#94a3b8' }}>
                        <span>{m.date} at {m.start_time}</span>
                        <span>•</span>
                        <span>Host: {m.created_by_name}</span>
                        <span>•</span>
                        <span>{m.target_type === 'all' ? 'Entire Workspace' : `${m.attendee_names?.length || 0} Member(s)`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Result Tag & Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div>
                      {hasAttendance ? (
                        isPresent ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            <CheckCircle2 size={14} /> Attended (Present)
                          </div>
                        ) : isLate ? (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            <Clock size={14} /> Attended (Late)
                          </div>
                        ) : (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            fontSize: 12,
                            fontWeight: 700
                          }}>
                            <XCircle size={14} /> Marked Absent
                          </div>
                        )
                      ) : (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#94a3b8',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          <Clock size={14} /> Awaiting Host Review
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAttendance(m)}
                      style={{
                        background: isHost && !hasAttendance 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: isHost && !hasAttendance 
                          ? 'none' 
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        padding: '7px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      {isHost && !hasAttendance ? (
                        <>
                          <ClipboardCheck size={14} /> Mark Attendance
                        </>
                      ) : (
                        <>
                          View Full Attendance <ChevronRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MEETINGS ATTENDANCE MANAGER
          ========================================================================= */}
      {activeTab === 'manage_meetings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {meetings
            .filter(m => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return m.title.toLowerCase().includes(q) || m.created_by_name?.toLowerCase().includes(q);
            })
            .map(m => {
              const hasAttendance = Boolean(m.attendance);
              const isHostOrAdmin = Boolean(
                user && (
                  isAdmin || 
                  user.role === 'ceo' || 
                  m.created_by_id === user.id || 
                  m.created_by_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
                )
              );

              const turnoutRate = m.attendance 
                ? Math.round((m.attendance.present_count / (m.attendance.total_attendees || 1)) * 100) 
                : null;

              return (
                <div
                  key={m.id}
                  style={{
                    background: 'rgba(12, 16, 26, 0.55)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff' }}>
                        {m.title}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8'
                      }}>
                        {m.category}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                      <span>{m.date} at {m.start_time}</span>
                      <span>•</span>
                      <span>Host: <strong style={{ color: '#f1f5f9' }}>{m.created_by_name}</strong></span>
                      <span>•</span>
                      <span>Expected: {m.target_type === 'all' ? 'All Team' : `${m.attendee_names?.length || 0} Members`}</span>
                    </div>
                  </div>

                  {/* Attendance Details & Trigger */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {hasAttendance ? (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                          {m.attendance?.present_count}/{m.attendance?.total_attendees} Present ({turnoutRate}%)
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          Finalized on {m.attendance?.marked_at ? new Date(m.attendance.marked_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <span style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                        Roster Not Finalized
                      </span>
                    )}

                    {isHostOrAdmin ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAttendance(m)}
                        style={{
                          background: hasAttendance 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: hasAttendance 
                            ? '1px solid rgba(255, 255, 255, 0.12)' 
                            : 'none',
                          color: '#ffffff',
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: !hasAttendance ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
                        }}
                      >
                        <UserCheck size={14} />
                        {hasAttendance ? 'Update Attendance' : 'Mark Attendance'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAttendance(m)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: '#ffffff',
                          padding: '8px 14px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        View Attendance <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEAM LEADERBOARD & ROSTER
          ========================================================================= */}
      {activeTab === 'team_roster' && isLeaderOrAdmin && (
        <div style={{
          background: 'rgba(12, 16, 26, 0.55)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Company-wide Attendance Scorecards
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Performance &amp; reliability records across all workspace meetings
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  color: '#ffffff',
                  fontSize: 12,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all" style={{ background: '#0f172a', color: '#fff' }}>All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name} style={{ background: '#0f172a', color: '#fff' }}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {teamRosterStats
              .filter(entry => {
                if (selectedDepartment !== 'all') {
                  const dept = (entry.profile.department || 'General').toLowerCase();
                  if (dept !== selectedDepartment.toLowerCase()) return false;
                }
                if (searchQuery) {
                  const q = searchQuery.toLowerCase();
                  const match = entry.profile.full_name.toLowerCase().includes(q) || 
                                entry.profile.department?.toLowerCase().includes(q);
                  if (!match) return false;
                }
                return true;
              })
              .map((entry, idx) => (
                <div
                  key={entry.profile.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', width: 22 }}>
                      #{idx + 1}
                    </span>
                    <UserAvatar
                      src={entry.profile.avatar_url}
                      name={entry.profile.full_name}
                      size={36}
                      fontSize={13}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                        {entry.profile.full_name}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {entry.profile.department || 'General'} • {entry.profile.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>{entry.attended}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Attended</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: entry.absent > 0 ? '#ef4444' : '#64748b' }}>{entry.absent}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Missed</div>
                    </div>

                    <div style={{ width: 140 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: '#94a3b8' }}>Rate</span>
                        <span style={{ fontWeight: 700, color: entry.rate >= 80 ? '#34d399' : '#fbbf24' }}>{entry.rate}%</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${entry.rate}%`,
                          height: '100%',
                          background: entry.rate >= 80 ? '#10b981' : '#f59e0b',
                          borderRadius: 99
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {isAttendanceModalOpen && selectedMeeting && (
        <MarkAttendanceModal
          isOpen={isAttendanceModalOpen}
          meeting={selectedMeeting}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setSelectedMeeting(null);
          }}
          onAttendanceSaved={(updated) => {
            setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m));
            setSelectedMeeting(updated);
          }}
        />
      )}
    </div>
  );
};
