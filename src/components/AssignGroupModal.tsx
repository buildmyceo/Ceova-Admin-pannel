import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { usePortalData } from '../context/PortalDataContext';
import { UserAvatar } from './UserAvatar';
import { CreateGroupModal } from './CreateGroupModal';
import { 
  X, 
  Check, 
  Megaphone, 
  Code2, 
  GraduationCap, 
  Users, 
  Shield, 
  AlertTriangle, 
  FolderPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface AssignGroupModalProps {
  isOpen: boolean;
  member: Profile | null;
  unassignedMembers?: Profile[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignGroupModal: React.FC<AssignGroupModalProps> = ({
  isOpen,
  member,
  unassignedMembers = [],
  onClose,
  onSuccess
}) => {
  const { refreshData, departments } = usePortalData();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [role, setRole] = useState<'member' | 'intern' | 'admin'>('member');
  const [group, setGroup] = useState<string>('Development');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [customDesignation, setCustomDesignation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const availableGroups = React.useMemo(() => {
    const list = [...departments];
    if (!list.some(d => d.name.toLowerCase() === 'development')) {
      list.unshift({ id: 'dept-dev', name: 'Development', code: 'dev', description: 'Software engineering, tech, and architecture', color: '#3b82f6' });
    }
    if (!list.some(d => d.name.toLowerCase() === 'marketing')) {
      list.unshift({ id: 'dept-mkt', name: 'Marketing', code: 'mkt', description: 'Brand identity, growth, and campaigns', color: '#ec4899' });
    }
    return list;
  }, [departments]);

  // Determine which member is currently being edited
  const currentMember = React.useMemo(() => {
    if (selectedMemberId) {
      const found = unassignedMembers.find(m => m.id === selectedMemberId);
      if (found) return found;
    }
    return member || unassignedMembers[0] || null;
  }, [selectedMemberId, member, unassignedMembers]);

  // Sync initial state when modal opens or target member changes
  useEffect(() => {
    if (currentMember) {
      setSelectedMemberId(currentMember.id);
      const curRole = (currentMember.role === 'intern' ? 'intern' : currentMember.role === 'admin' ? 'admin' : 'member');
      setRole(curRole);

      const curDept = (currentMember.department || '').trim();
      const matched = availableGroups.find(g => g.name.toLowerCase() === curDept.toLowerCase());
      if (matched) {
        setGroup(matched.name);
      } else if (curDept && curDept.toLowerCase() !== 'general' && curDept.toLowerCase() !== 'unassigned' && curDept.toLowerCase() !== 'internship') {
        setGroup(curDept);
      } else {
        setGroup(availableGroups[0]?.name || 'Development');
      }

      setCustomDesignation(currentMember.designation || '');
    }
    setMessage('');
    setIsError(false);
  }, [currentMember, availableGroups]);

  if (!isOpen || !currentMember) return null;

  const computedDesignation = 
    customDesignation.trim() 
      ? customDesignation.trim() 
      : role === 'admin' 
        ? 'Administrator' 
        : role === 'intern' 
          ? `${group} Intern` 
          : `${group} Specialist`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !group.trim()) {
      setIsError(true);
      setMessage('Please select or create a group for this member.');
      return;
    }

    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Database connection is not configured.');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          department: group,
          designation: computedDesignation,
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentMember.id);

      if (profileError) {
        throw new Error(profileError.message || 'Failed to update member group.');
      }

      // Also attempt sync with invitations table if exists
      if (currentMember.email) {
        try {
          await supabase
            .from('invitations')
            .update({ department: group, role })
            .ilike('email', currentMember.email.trim());
        } catch (_) {}
      }

      await refreshData();

      setMessage(`✓ Successfully assigned ${currentMember.full_name || currentMember.email} to ${group} (${role === 'intern' ? 'Intern' : 'Member'})!`);

      if (onSuccess) onSuccess();

      // Check if there are other unassigned members left
      const remainingUnassigned = unassignedMembers.filter(m => m.id !== currentMember.id);
      if (remainingUnassigned.length > 0) {
        setTimeout(() => {
          setSelectedMemberId(remainingUnassigned[0].id);
          setMessage('');
        }, 1200);
      } else {
        setTimeout(() => {
          onClose();
        }, 1400);
      }
    } catch (err: any) {
      setIsError(true);
      setMessage(err?.message || 'Error updating member group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#0e0e11',
          border: '1px solid #27272a',
          borderRadius: 18,
          padding: 26,
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 18
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close modal"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#161618',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#222226';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#161618';
            e.currentTarget.style.color = '#a1a1aa';
          }}
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid #1f1f23' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}>
            <FolderPlus size={20} />
          </div>
          <div style={{ paddingRight: 36 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Assign Workspace Group
            </h3>
            <div style={{ fontSize: 12.5, color: '#a1a1aa', marginTop: 3 }}>
              Select whether this user belongs to <strong>Marketing</strong> or <strong>Development</strong>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div style={{ 
            padding: '11px 14px', 
            borderRadius: 8, 
            background: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            color: isError ? '#ef4444' : '#22c55e',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12.5
          }}>
            {isError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{message}</span>
          </div>
        )}

        {/* If multiple unassigned members exist, provide quick switcher */}
        {unassignedMembers.length > 1 && (
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Select Member ({unassignedMembers.length} Unassigned Remaining)
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  setMessage('');
                }}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #27272a',
                  background: '#141416',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {unassignedMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email} ({m.role.toUpperCase()} • {m.department || 'No Group'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Target User Info Card */}
        <div style={{
          padding: '12px 14px',
          borderRadius: 10,
          background: '#141416',
          border: '1px solid #222225',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <UserAvatar
            src={currentMember.avatar_url}
            name={currentMember.full_name}
            size={42}
            fontSize={16}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentMember.full_name || 'Ceova User'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentMember.email}
            </div>
          </div>
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            background: currentMember.role === 'intern' ? 'rgba(245, 158, 11, 0.15)' : '#222226',
            color: currentMember.role === 'intern' ? '#fbbf24' : '#e4e4e7',
            border: currentMember.role === 'intern' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #333338',
            textTransform: 'uppercase'
          }}>
            {currentMember.role}
          </span>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Clearance Track Switcher: Member vs Intern */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Workspace Track
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                type="button"
                onClick={() => setRole('member')}
                style={{
                  padding: '9px 8px',
                  borderRadius: 8,
                  border: role === 'member' ? '1px solid #ffffff' : '1px solid #27272a',
                  background: role === 'member' ? '#222226' : '#141416',
                  color: role === 'member' ? '#ffffff' : '#a1a1aa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Users size={14} style={{ color: role === 'member' ? '#ffffff' : '#71717a' }} />
                <span>Member</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('intern')}
                style={{
                  padding: '9px 8px',
                  borderRadius: 8,
                  border: role === 'intern' ? '1px solid #fbbf24' : '1px solid #27272a',
                  background: role === 'intern' ? 'rgba(245, 158, 11, 0.15)' : '#141416',
                  color: role === 'intern' ? '#fbbf24' : '#a1a1aa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <GraduationCap size={14} style={{ color: role === 'intern' ? '#fbbf24' : '#71717a' }} />
                <span>Intern</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                style={{
                  padding: '9px 8px',
                  borderRadius: 8,
                  border: role === 'admin' ? '1px solid #60a5fa' : '1px solid #27272a',
                  background: role === 'admin' ? 'rgba(96, 165, 250, 0.15)' : '#141416',
                  color: role === 'admin' ? '#60a5fa' : '#a1a1aa',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Shield size={14} style={{ color: role === 'admin' ? '#60a5fa' : '#71717a' }} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* Group Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Group <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0
                }}
              >
                <FolderPlus size={13} />
                <span>+ Make New Group</span>
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
              gap: 10,
              maxHeight: 220,
              overflowY: 'auto',
              paddingRight: 4
            }}>
              {availableGroups.map((g) => {
                const isSelected = group.toLowerCase() === g.name.toLowerCase();
                const groupColor = g.color || '#3b82f6';
                return (
                  <div
                    key={g.id || g.name}
                    onClick={() => setGroup(g.name)}
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      border: isSelected ? `1px solid ${groupColor}` : '1px solid #27272a',
                      background: isSelected ? 'rgba(255, 255, 255, 0.08)' : '#141416',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      boxShadow: isSelected ? `0 0 16px ${groupColor}25` : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: `${groupColor}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: groupColor
                      }}>
                        {g.name.toLowerCase().includes('market') ? (
                          <Megaphone size={13} />
                        ) : g.name.toLowerCase().includes('dev') ? (
                          <Code2 size={13} />
                        ) : (
                          <Sparkles size={13} />
                        )}
                      </div>
                      {isSelected && (
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: groupColor,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10
                        }}>
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: isSelected ? '#ffffff' : '#e4e4e7' }}>
                      {g.name}
                    </div>
                    {g.description && (
                      <div style={{ fontSize: 10.5, color: '#a1a1aa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.description}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* + Make New Group Tile */}
              <div
                onClick={() => setIsCreateGroupOpen(true)}
                style={{
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px dashed #3f3f46',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  minHeight: 75,
                  textAlign: 'center'
                }}
              >
                <FolderPlus size={16} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>+ Make Group</span>
                <span style={{ fontSize: 10, color: '#71717a' }}>Create custom</span>
              </div>
            </div>
          </div>

          {/* Title / Designation field */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              Role Designation
            </label>
            <input
              type="text"
              value={customDesignation}
              onChange={(e) => setCustomDesignation(e.target.value)}
              placeholder={role === 'intern' ? `${group} Intern` : `${group} Specialist`}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #27272a',
                background: '#141416',
                color: '#ffffff',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4, paddingTop: 16, borderTop: '1px solid #1f1f23' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                background: '#161618',
                border: '1px solid #27272a',
                borderRadius: 8,
                color: '#a1a1aa',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Cancel
            </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '9px 22px',
                  background: '#fbbf24',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{loading ? 'Saving...' : `Assign to ${group}`}</span>
              </button>
            </div>
          </form>
        </div>

        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          onClose={() => setIsCreateGroupOpen(false)}
          onSuccess={(newDept) => setGroup(newDept.name)}
          initialRole={role}
        />
      </div>
    );
  };
