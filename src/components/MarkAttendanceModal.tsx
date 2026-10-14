import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Calendar, 
  Check, 
  Search, 
  AlertCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Meeting, MeetingAttendance, MeetingAttendanceRecord, AttendanceStatus, Profile } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { updateMeetingAttendance } from '../lib/meetingsService';
import { UserAvatar } from './UserAvatar';
import { sanitizeUrl } from '../lib/security';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onAttendanceSaved?: (updatedMeeting: Meeting) => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onAttendanceSaved
}) => {
  const { user, isAdmin } = useAuth();
  const { members } = usePortalData();

  const isCreatorOrAdmin = Boolean(
    user && meeting && (
      isAdmin || 
      user.role === 'ceo' || 
      meeting.created_by_id === user.id ||
      meeting.created_by_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
    )
  );

  const [isEditing, setIsEditing] = useState(false);
  const [records, setRecords] = useState<MeetingAttendanceRecord[]>([]);
  const [summaryNotes, setSummaryNotes] = useState('');
  const [meetingStatus, setMeetingStatus] = useState<'completed' | 'ongoing' | 'upcoming'>('completed');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Build the expected roster for this meeting
  useEffect(() => {
    if (!meeting) return;

    setSummaryNotes(meeting.attendance?.summary_notes || '');
    setMeetingStatus(meeting.status === 'completed' ? 'completed' : 'completed');

    // If meeting already has recorded attendance, initialize with that
    if (meeting.attendance && meeting.attendance.records && meeting.attendance.records.length > 0) {
      setRecords(meeting.attendance.records);
      setIsEditing(false);
      return;
    }

    // Default to edit mode if creator/admin and no attendance yet
    setIsEditing(isCreatorOrAdmin);

    // Otherwise, generate initial roster based on target_type and attendee_ids
    let initialRoster: MeetingAttendanceRecord[] = [];

    if (meeting.target_type === 'all') {
      // All active members in workspace
      initialRoster = members
        .filter(m => m.status !== 'blocked')
        .map(m => ({
          user_id: m.id,
          user_name: m.full_name,
          user_email: m.email,
          user_avatar: m.avatar_url,
          department: m.department,
          role: m.role,
          status: 'present' as AttendanceStatus,
          notes: ''
        }));
    } else {
      // Selected members
      const attendeeIds = meeting.attendee_ids || [];
      const attendeeNames = meeting.attendee_names || [];

      // Match by ID first
      const matchedMembers = members.filter(m => attendeeIds.includes(m.id));

      if (matchedMembers.length > 0) {
        initialRoster = matchedMembers.map(m => ({
          user_id: m.id,
          user_name: m.full_name,
          user_email: m.email,
          user_avatar: m.avatar_url,
          department: m.department,
          role: m.role,
          status: 'present' as AttendanceStatus,
          notes: ''
        }));
      } else if (attendeeNames.length > 0) {
        // Fallback to attendee names if IDs are missing or non-matching
        initialRoster = attendeeNames.map((name, idx) => {
          const matched = members.find(m => 
            m.full_name.toLowerCase().trim() === name.toLowerCase().trim() ||
            name.toLowerCase().includes(m.email.toLowerCase())
          );
          return {
            user_id: matched?.id || `ext_${idx}_${name}`,
            user_name: matched?.full_name || name,
            user_email: matched?.email,
            user_avatar: matched?.avatar_url,
            department: matched?.department || 'General',
            role: matched?.role || 'member',
            status: 'present' as AttendanceStatus,
            notes: ''
          };
        });
      } else {
        // Fallback to all members if none specified
        initialRoster = members.slice(0, 5).map(m => ({
          user_id: m.id,
          user_name: m.full_name,
          user_email: m.email,
          user_avatar: m.avatar_url,
          department: m.department,
          role: m.role,
          status: 'present' as AttendanceStatus,
          notes: ''
        }));
      }
    }

    setRecords(initialRoster);
  }, [meeting, members, isCreatorOrAdmin]);

  // Attendance metrics
  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const rate = total > 0 ? Math.round(((present + (late * 0.5)) / total) * 100) : 0;
    return { total, present, absent, late, rate };
  }, [records]);

  // Current user's individual attendance record
  const myRecord = useMemo(() => {
    if (!user) return null;
    return records.find(r => 
      r.user_id === user.id || 
      r.user_email?.toLowerCase() === user.email?.toLowerCase() ||
      r.user_name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
    );
  }, [records, user]);

  // Filtered roster for search
  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return records;
    return records.filter(r => 
      r.user_name.toLowerCase().includes(q) ||
      (r.user_email && r.user_email.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q))
    );
  }, [records, searchQuery]);

  // Handlers to update status
  const handleSetStatus = (userId: string, newStatus: AttendanceStatus) => {
    setRecords(prev => prev.map(r => r.user_id === userId ? { ...r, status: newStatus } : r));
  };

  const handleSetNote = (userId: string, note: string) => {
    setRecords(prev => prev.map(r => r.user_id === userId ? { ...r, notes: note } : r));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSaveAttendance = async () => {
    if (!meeting || !user) return;
    setIsSaving(true);
    setSuccessMessage(null);

    const attendanceData: MeetingAttendance = {
      meeting_id: meeting.id,
      marked_at: new Date().toISOString(),
      marked_by_id: user.id,
      marked_by_name: user.full_name || 'Admin',
      records,
      summary_notes: summaryNotes.trim() || undefined,
      total_attendees: stats.total,
      present_count: stats.present,
      absent_count: stats.absent,
      late_count: stats.late
    };

    try {
      const updated = await updateMeetingAttendance(meeting.id, attendanceData, meetingStatus);
      if (updated) {
        setSuccessMessage('Attendance recorded & published to all attendees successfully!');
        if (onAttendanceSaved) onAttendanceSaved(updated);
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !meeting) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 9999
      }}
    >
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          background: '#0d111a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.2) 100%)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 8px',
                borderRadius: 6,
                background: meeting.category === 'executive' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: meeting.category === 'executive' ? '#60a5fa' : '#34d399',
                border: meeting.category === 'executive' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                {meeting.category}
              </span>

              {meeting.attendance ? (
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <CheckCircle2 size={11} />
                  Attendance Finalized
                </span>
              ) : (
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <Clock size={11} />
                  Attendance Pending
                </span>
              )}
            </div>

            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: 19,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.3
            }}>
              {meeting.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} style={{ color: '#38bdf8' }} />
                {meeting.date} at {meeting.start_time} ({meeting.duration_minutes}m)
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Users size={13} style={{ color: '#a78bfa' }} />
                Host: <strong style={{ color: '#f1f5f9' }}>{meeting.created_by_name}</strong>
              </span>
              {meeting.meet_link && (
                <>
                  <span>•</span>
                  <a 
                    href={sanitizeUrl(meeting.meet_link)} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ 
                      color: '#34d399', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 4, 
                      textDecoration: 'none',
                      fontWeight: 600
                    }}
                  >
                    Google Meet <ExternalLink size={11} />
                  </a>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: 8,
              padding: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '10px 24px',
            color: '#34d399',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Sparkles size={15} />
            {successMessage}
          </div>
        )}

        {/* User's Personal Result Banner */}
        {myRecord ? (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '12px 18px',
            borderRadius: 12,
            background: myRecord.status === 'present' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)' 
              : myRecord.status === 'late'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)',
            border: myRecord.status === 'present'
              ? '1px solid rgba(16, 185, 129, 0.35)'
              : myRecord.status === 'late'
              ? '1px solid rgba(245, 158, 11, 0.35)'
              : '1px solid rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: myRecord.status === 'present' ? 'rgba(16, 185, 129, 0.2)' : myRecord.status === 'late' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: myRecord.status === 'present' ? '#34d399' : myRecord.status === 'late' ? '#fbbf24' : '#f87171'
              }}>
                {myRecord.status === 'present' ? <CheckCircle2 size={20} /> : myRecord.status === 'late' ? <Clock size={20} /> : <XCircle size={20} />}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Your Attendance Result
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  {myRecord.status === 'present' && 'You were marked: ATTENDED (Present) ✅'}
                  {myRecord.status === 'late' && 'You were marked: ATTENDED (Late) ⏱'}
                  {myRecord.status === 'absent' && 'You were marked: ABSENT ❌'}
                </div>
              </div>
            </div>

            {meeting.attendance && (
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>
                Recorded by {meeting.attendance.marked_by_name}
              </span>
            )}
          </div>
        ) : (isCreatorOrAdmin || meeting.created_by_id === user?.id || meeting.created_by_name?.toLowerCase().trim() === user?.full_name?.toLowerCase().trim()) ? (
          <div style={{
            margin: '16px 24px 0 24px',
            padding: '12px 18px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399'
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Your Role &amp; Attendance Status
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  Meeting Host &amp; Organizer • ATTENDED (Present) ✅
                </div>
              </div>
            </div>

            {meeting.attendance && (
              <span style={{ fontSize: 11.5, color: '#34d399', fontWeight: 600 }}>
                Attendance Finalized
              </span>
            )}
          </div>
        ) : null}

        {/* Summary Metric Ribbon */}
        <div style={{
          padding: '16px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Expected Roster</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>{stats.total}</div>
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderRadius: 12,
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: 11, color: '#34d399', marginBottom: 2 }}>Attended (Present)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{stats.present}</div>
          </div>

          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 12,
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: 11, color: '#f87171', marginBottom: 2 }}>Absent</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{stats.absent}</div>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: 12,
            padding: '12px 14px'
          }}>
            <div style={{ fontSize: 11, color: '#60a5fa', marginBottom: 2 }}>Turnout Rate</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#3b82f6' }}>{stats.rate}%</div>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div style={{
          padding: '0 24px 12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          {/* Search box */}
          <div style={{
            position: 'relative',
            flex: '1 1 200px'
          }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search member in roster..."
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

          {/* Host/Admin Controls */}
          {isCreatorOrAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#34d399',
                      padding: '6px 12px',
                      borderRadius: 7,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Check size={12} /> All Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '6px 12px',
                      borderRadius: 7,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <X size={12} /> All Absent
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '6px 14px',
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <UserCheck size={13} /> Edit Attendance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Member List Table / Roster */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 24px 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {filteredRecords.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 16px',
              color: '#64748b',
              fontSize: 13
            }}>
              No members found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredRecords.map((r) => {
              const isPresent = r.status === 'present';
              const isAbsent = r.status === 'absent';
              const isLate = r.status === 'late';

              return (
                <div
                  key={r.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: isPresent 
                      ? 'rgba(16, 185, 129, 0.04)' 
                      : isAbsent 
                      ? 'rgba(239, 68, 68, 0.04)' 
                      : 'rgba(255, 255, 255, 0.02)',
                    border: isPresent
                      ? '1px solid rgba(16, 185, 129, 0.15)'
                      : isAbsent
                      ? '1px solid rgba(239, 68, 68, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: 10,
                    gap: 12
                  }}
                >
                  {/* Member info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <UserAvatar
                      src={r.user_avatar}
                      name={r.user_name}
                      size={34}
                      fontSize={13}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {r.user_name}
                        {r.user_id === user?.id && (
                          <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: '#3b82f6', color: '#fff', fontWeight: 700 }}>
                            YOU
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {r.department || 'General'} {r.role ? `• ${r.role}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Selector / Status Pill */}
                  {isEditing && isCreatorOrAdmin ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Present button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(r.user_id, 'present')}
                        style={{
                          background: isPresent ? '#059669' : 'rgba(255, 255, 255, 0.04)',
                          border: isPresent ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isPresent ? '#ffffff' : '#94a3b8',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <Check size={12} /> Present
                      </button>

                      {/* Late button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(r.user_id, 'late')}
                        style={{
                          background: isLate ? '#d97706' : 'rgba(255, 255, 255, 0.04)',
                          border: isLate ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isLate ? '#ffffff' : '#94a3b8',
                          padding: '6px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <Clock size={12} /> Late
                      </button>

                      {/* Absent button */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(r.user_id, 'absent')}
                        style={{
                          background: isAbsent ? '#dc2626' : 'rgba(255, 255, 255, 0.04)',
                          border: isAbsent ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                          color: isAbsent ? '#ffffff' : '#94a3b8',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <X size={12} /> Absent
                      </button>
                    </div>
                  ) : (
                    <div>
                      {isPresent && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          <CheckCircle2 size={13} /> Present
                        </span>
                      )}
                      {isLate && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          <Clock size={13} /> Late
                        </span>
                      )}
                      {isAbsent && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontSize: 11.5,
                          fontWeight: 700
                        }}>
                          <XCircle size={13} /> Absent
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Meeting Notes / Summary (Host / Admin editable) */}
        {isEditing && isCreatorOrAdmin && (
          <div style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: '#94a3b8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <FileText size={13} /> Host Meeting Notes / Follow-ups (Optional)
            </div>
            <textarea
              rows={2}
              placeholder="e.g., Reviewed sprint deliverables, approved Q4 goals..."
              value={summaryNotes}
              onChange={e => setSummaryNotes(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                color: '#ffffff',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}

        {/* Existing Host Notes if not editing */}
        {!isEditing && meeting.attendance?.summary_notes && (
          <div style={{
            margin: '0 24px 12px 24px',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>
              Host Meeting Notes
            </div>
            <div style={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.4 }}>
              {meeting.attendance.summary_notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
            {meeting.attendance ? (
              <span>Last updated on {new Date(meeting.attendance.marked_at).toLocaleDateString()}</span>
            ) : (
              <span>Only meeting creator or admins can publish attendance.</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>

            {isEditing && isCreatorOrAdmin && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAttendance}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '8px 20px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {isSaving ? (
                  <>Saving Attendance...</>
                ) : (
                  <>
                    <ShieldCheck size={14} /> Save &amp; Publish Attendance
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
