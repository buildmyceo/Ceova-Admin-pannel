import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { getSupabaseClient } from '../lib/supabase';
import { sanitizeSocialLink } from '../lib/security';
import { 
  Users, 
  UserPlus, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Clock, 
  RefreshCw, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  Briefcase, 
  Shield, 
  LayoutGrid, 
  List, 
  Search,
  ExternalLink,
  FileText,
  Sparkles,
  Bell
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';

interface MembersViewProps {
  onNavigate?: (tab: NavTab) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onNavigate }) => {
  const { user: currentUser, isAdmin, savedAccounts } = useAuth();
  const { members, refreshData, isUserOnline, isLoadingData } = usePortalData();

  // View state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member' | 'intern'>('all');
  const [copiedEmailMap, setCopiedEmailMap] = useState<{ [id: string]: boolean }>({});

  // Invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Helper: Format date & time of last online
  const formatLastSeen = (dateInput?: string | null): { formatted: string; relative: string } => {
    if (!dateInput) {
      return { formatted: 'No activity recorded', relative: 'Never' };
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return { formatted: 'Unknown', relative: 'Unknown' };
    }

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isToday = now.toDateString() === d.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === d.toDateString();

    let relative = `${diffMins}m ago`;
    if (diffMins === 0) relative = 'Just now';
    else if (diffHours >= 1 && diffHours < 24) relative = `${diffHours}h ${diffMins % 60}m ago`;
    else if (diffDays >= 1) relative = `${diffDays}d ago`;

    let formatted = '';
    if (isToday) {
      formatted = `Today at ${timeStr}`;
    } else if (isYesterday) {
      formatted = `Yesterday at ${timeStr}`;
    } else {
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      formatted = `${dateStr} at ${timeStr}`;
    }

    return { formatted, relative };
  };

  // Helper: Format social link URL safely
  const getSocialLink = (platform: string, rawValue?: string | null) => {
    return sanitizeSocialLink(platform, rawValue);
  };

  // One-click copy email
  const handleCopyEmail = (id: string, emailStr: string) => {
    if (!emailStr) return;
    navigator.clipboard.writeText(emailStr);
    setCopiedEmailMap(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedEmailMap(prev => ({ ...prev, [id]: false }));
    }, 1800);
  };

  // Direct Send Notification to specific member
  const handleNotifyMember = (memberId: string) => {
    sessionStorage.setItem('ceova_compose_target_member', memberId);
    window.dispatchEvent(new CustomEvent('ceova_open_compose_notification', { detail: { memberId } }));
    if (onNavigate) {
      onNavigate('notifications');
    }
  };

  // Send invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not configured.');

      const cleanEmail = email.trim().toLowerCase();
      const generatedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // 1. Add directly to profiles table with status 'pending' so member appears in list immediately
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          email: cleanEmail,
          full_name: generatedName,
          role: role,
          department: role === 'admin' ? 'Administration' : role === 'intern' ? 'Internship' : 'Development',
          designation: role === 'admin' ? 'Administrator' : role === 'intern' ? 'Intern' : 'Team Member',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], { onConflict: 'email' });

      if (profileError) {
        console.warn('Profile upsert note:', profileError);
      }

      // 2. Also record in invitations table
      try {
        await supabase
          .from('invitations')
          .upsert([{ email: cleanEmail, role }], { onConflict: 'email' });
      } catch (_) {}

      setMessage(`Member ${cleanEmail} added to workspace! They can now log in with their email and chosen password to receive a Supabase confirmation link.`);
      setEmail('');
      setRole('member');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setMessage('');
        refreshData();
      }, 2500);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered members list with all rich profile attributes merged
  const filteredMembers = useMemo(() => {
    return members.map((rawMember) => {
      // Merge with currentUser and saved accounts to ensure all latest added profile details appear
      const savedAcc = savedAccounts?.find(a => 
        (a.profile.id && a.profile.id === rawMember.id) || 
        (a.profile.email && a.profile.email.toLowerCase() === rawMember.email?.toLowerCase())
      );
      const isCur = currentUser?.id && rawMember.id === currentUser.id;
      return {
        ...rawMember,
        ...(savedAcc ? savedAcc.profile : {}),
        ...(isCur ? currentUser : {})
      };
    }).filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q || 
        (m.full_name || '').toLowerCase().includes(q) || 
        (m.email || '').toLowerCase().includes(q) || 
        (m.designation || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q);

      const normalizedRole = (m.role || '').toLowerCase();
      let matchesRole = true;
      if (roleFilter === 'admin') matchesRole = normalizedRole === 'admin' || normalizedRole === 'ceo';
      else if (roleFilter === 'member') matchesRole = normalizedRole === 'member';
      else if (roleFilter === 'intern') matchesRole = normalizedRole === 'intern';

      return matchesSearch && matchesRole;
    });
  }, [members, currentUser, savedAccounts, searchQuery, roleFilter]);

  // Real-time presence counts (Instant sync)
  const presenceCounts = useMemo(() => {
    let online = 0;
    let offline = 0;
    members.forEach((m) => {
      if (isUserOnline(m.id)) {
        online++;
      } else {
        offline++;
      }
    });
    return { online, offline, total: members.length };
  }, [members, isUserOnline]);

  return (
    <div className="view-container fade-in" style={{ paddingBottom: 48 }}>
      {/* Top Header */}
      <div className="panel-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div className="panel-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#161618',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Users size={20} />
            </div>
            <div>
              <h2 className="neo-serif-title" style={{ fontSize: 24, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                Team Members
              </h2>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: '#101012',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: 3,
            gap: 2
          }}>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Cards Grid View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'cards' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table List View"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'table' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>

          {/* Send Notification Button */}
          <button 
            type="button" 
            onClick={() => {
              if (onNavigate) onNavigate('notifications');
              else window.dispatchEvent(new CustomEvent('ceova_open_compose_notification'));
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 8,
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60a5fa',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={15} />
            <span>Send Notification</span>
          </button>

          {isAdmin && (
            <button 
              className="btn btn-primary" 
              onClick={() => setIsInviteModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              <UserPlus size={15} />
              <span>Invite Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Live Presence Summary Bar (Solid Colors) */}
      <div style={{
        background: '#0d0d0f',
        border: '1px solid #222225',
        borderRadius: 14,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Presence Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e'
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
            {presenceCounts.online} Active in Portal
          </span>
        </div>

        <div style={{ width: 1, height: 16, background: '#27272a' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#71717a'
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa' }}>
            {presenceCounts.offline} Offline
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 22
      }}>
        <div style={{
          position: 'relative',
          width: 320,
          maxWidth: '100%'
        }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search member, email, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: '#0d0d0f',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 13,
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {(['all', 'admin', 'member', 'intern'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: roleFilter === r ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                background: roleFilter === r ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: roleFilter === r ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {r === 'all' ? 'All Roles' : r === 'admin' ? 'Admins' : r === 'member' ? 'Members' : 'Interns'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoadingData && members.length === 0 ? (
        <div style={{
          background: 'rgba(12, 16, 26, 0.52)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
          border: '1px solid rgba(255, 255, 255, 0.11)',
          borderRadius: 18,
          padding: 60,
          textAlign: 'center',
          color: 'var(--text-muted)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: '#60a5fa' }} />
          <p style={{ margin: 0, fontSize: 14 }}>Connecting to live presence and loading directory...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div style={{
          background: 'rgba(12, 16, 26, 0.52)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
          border: '1px solid rgba(255, 255, 255, 0.11)',
          borderRadius: 18,
          padding: 60,
          textAlign: 'center',
          color: 'var(--text-muted)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ffffff' }}>No team members found</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
            Try adjusting your search query or role filter.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 22
        }}>
          {filteredMembers.map((member) => {
            const isOnline = isUserOnline(member.id);
            const isCurrent = currentUser?.id && member.id === currentUser.id;
            const isAdminRole = member.role === 'admin' || member.role === 'ceo';
            const isInternRole = member.role === 'intern';
            const presenceInfo = formatLastSeen(member.last_active_at || member.updated_at || member.created_at);
            const hasSocial = member.social_links && Object.values(member.social_links).some(v => Boolean(v));

            return (
              <div
                key={member.id}
                style={{
                  background: 'rgba(12, 16, 26, 0.52)',
                  backdropFilter: 'blur(28px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
                  border: '1px solid rgba(255, 255, 255, 0.11)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
                }}
              >
                {/* 1. Card Top Cover Banner - Solid Background */}
                <div style={{
                  height: 84,
                  width: '100%',
                  position: 'relative',
                  backgroundColor: '#161618',
                  backgroundImage: member.cover_url ? `url(${member.cover_url})` : 'none',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  backgroundRepeat: 'no-repeat',
                  borderBottom: '1px solid #222225'
                }}>
                  {/* Top Right Role Pill - Solid Colors, No Neon */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    zIndex: 2
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: isAdminRole 
                        ? '#27272a' 
                        : isInternRole 
                          ? '#202024' 
                          : '#1c1c1f',
                      border: isAdminRole 
                        ? '1px solid #3f3f46' 
                        : isInternRole 
                          ? '1px solid #2e2e33' 
                          : '1px solid #2e2e33',
                      color: isAdminRole ? '#ffffff' : isInternRole ? '#a1a1aa' : '#e4e4e7',
                      textTransform: 'uppercase'
                    }}>
                      <Shield size={10} />
                      {isAdminRole ? 'ADMIN' : isInternRole ? 'INTERN' : 'MEMBER'}
                    </span>
                  </div>
                </div>

                {/* 2. Card Body Content */}
                <div style={{ padding: '0 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Avatar & Online Dot */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 14 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{
                        width: 68,
                        height: 68,
                        borderRadius: '50%',
                        border: '3px solid #0d0d0f',
                        background: '#161618',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                      }}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
                            {(member.full_name || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Status indicator ring & dot (Instant Sync, Solid Dot, No Neon Glow) */}
                      <div 
                        title={isOnline ? 'Active • In Portal' : 'Offline'}
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: isOnline ? '#22c55e' : '#71717a',
                          border: '2px solid #0d0d0f',
                          boxShadow: 'none',
                          transition: 'background 0.2s ease'
                        }}
                      />
                    </div>

                    {isCurrent && (
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#ffffff',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        padding: '2px 8px',
                        borderRadius: 100
                      }}>
                        You (Active)
                      </span>
                    )}
                  </div>

                  {/* Name and Designation */}
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{
                      fontSize: 16.5,
                      fontWeight: 700,
                      color: '#ffffff',
                      margin: '0 0 4px 0',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {member.full_name || 'Ceova Member'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Briefcase size={12} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {member.designation || 'Team Member'} • {member.department || 'General'}
                      </span>
                    </div>
                  </div>

                  {/* 3. Realtime Live Presence Box - Solid Colors, No Neon */}
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#141416',
                    border: '1px solid #222225',
                    marginBottom: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#71717a' }}>
                        Status
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: member.status === 'pending' ? '#fbbf24' : isOnline ? '#ffffff' : '#71717a'
                      }}>
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: member.status === 'pending' ? '#f59e0b' : isOnline ? '#22c55e' : '#71717a'
                        }} />
                        {member.status === 'pending' ? 'Invited • Pending Confirmation' : isOnline ? 'Active • In Portal' : 'Offline'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11.5, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
                      {member.status === 'pending' ? (
                        <span>Awaiting email confirmation & setup</span>
                      ) : isOnline ? (
                        <span>Online right now (Active in portal)</span>
                      ) : (
                        <span>Last online: <strong style={{ color: '#ffffff' }}>{presenceInfo.formatted}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* 4. Social Links Row (Shown on Member Card!) */}
                  {hasSocial && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {member.social_links?.github && (
                        <a 
                          href={getSocialLink('github', member.social_links.github)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="GitHub Profile"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e4e4e7',
                            fontSize: 11,
                            textDecoration: 'none'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.89 5.07 5.07 0 0 0-.14-3.83s-1.23-.4-4 1.44a13.38 13.38 0 0 0-7 0C4.23 1.28 3 1.68 3 1.68a5.07 5.07 0 0 0-.14 3.83 5.44 5.44 0 0 0-1.5 3.89c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 7 18v4"></path></svg>
                          <span>GitHub</span>
                          <ExternalLink size={9} style={{ color: 'var(--text-subtle)' }} />
                        </a>
                      )}

                      {member.social_links?.instagram && (
                        <a 
                          href={getSocialLink('instagram', member.social_links.instagram)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="Instagram Profile"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e4e4e7',
                            fontSize: 11,
                            textDecoration: 'none'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e1306c' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                          <span>Instagram</span>
                          <ExternalLink size={9} style={{ color: 'var(--text-subtle)' }} />
                        </a>
                      )}

                      {member.social_links?.linkedin && (
                        <a 
                          href={getSocialLink('linkedin', member.social_links.linkedin)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="LinkedIn Profile"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e4e4e7',
                            fontSize: 11,
                            textDecoration: 'none'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0a66c2' }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                          <span>LinkedIn</span>
                          <ExternalLink size={9} style={{ color: 'var(--text-subtle)' }} />
                        </a>
                      )}

                      {member.social_links?.twitter && (
                        <a 
                          href={getSocialLink('twitter', member.social_links.twitter)} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          title="X / Twitter Profile"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#e4e4e7',
                            fontSize: 11,
                            textDecoration: 'none'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                          <span>X</span>
                          <ExternalLink size={9} style={{ color: 'var(--text-subtle)' }} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* 5. Contact Information (Email with Copy button & Phone with Verified Badge) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
                        <Mail size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                        <span style={{
                          fontSize: 12,
                          color: '#e4e4e7',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {member.email}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(member.id, member.email)}
                        title="Copy email address"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedEmailMap[member.id] ? '#10b981' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          flexShrink: 0
                        }}
                      >
                        {copiedEmailMap[member.id] ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedEmailMap[member.id] ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {member.phone && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 6,
                        border: '1px solid rgba(255, 255, 255, 0.04)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Phone size={13} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#e4e4e7' }}>{member.phone}</span>
                        </div>
                        <span style={{
                          fontSize: 10,
                          color: '#e4e4e7',
                          background: '#18181b',
                          border: '1px solid #27272a',
                          padding: '2px 7px',
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 6. Bio & Overview Snippet (Shown if added!) */}
                  {member.bio && (
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderLeft: '2px solid rgba(255, 255, 255, 0.2)',
                      fontSize: 11.5,
                      color: '#d4d4d8',
                      lineHeight: 1.5,
                      marginBottom: 10
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                        <FileText size={10} />
                        <span>Bio</span>
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {member.bio}
                      </div>
                    </div>
                  )}

                  {/* 7. Skills & Specializations Chips (Shown if added!) */}
                  {member.skills && Array.isArray(member.skills) && member.skills.length > 0 && (
                    <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                        <Sparkles size={10} />
                        <span>Skills</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {member.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: 10.5,
                              padding: '2px 8px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: 100,
                              color: '#d4d4d8'
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Send Notification to this Member */}
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <button
                      type="button"
                      onClick={() => handleNotifyMember(member.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '7px 12px',
                        borderRadius: 8,
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#60a5fa',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Bell size={13} />
                      <span>Send Notification</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE LIST VIEW */
        <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role & Dept</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Online Time</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Links</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isOnline = isUserOnline(member.id);
                  const isAdminRole = member.role === 'admin' || member.role === 'ceo';
                  const isInternRole = member.role === 'intern';
                  const presenceInfo = formatLastSeen(member.last_active_at || member.updated_at || member.created_at);

                  return (
                    <tr 
                      key={member.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                        backgroundColor: '#0d0d0f'
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: '#161618',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                                {(member.full_name || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: 13.5 }}>
                              {member.full_name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                              {member.designation}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: isAdminRole ? '#27272a' : isInternRole ? '#202024' : '#1c1c1f',
                          border: isAdminRole ? '1px solid #3f3f46' : isInternRole ? '1px solid #2e2e33' : '1px solid #2e2e33',
                          color: isAdminRole ? '#ffffff' : isInternRole ? '#a1a1aa' : '#e4e4e7',
                          textTransform: 'uppercase'
                        }}>
                          {isAdminRole ? 'ADMIN' : isInternRole ? 'INTERN' : 'MEMBER'}
                        </span>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
                          {member.department}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 100,
                          fontSize: 11,
                          fontWeight: 600,
                          background: member.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : '#161618',
                          border: member.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #27272a',
                          color: member.status === 'pending' ? '#fbbf24' : isOnline ? '#ffffff' : '#71717a'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.status === 'pending' ? '#f59e0b' : isOnline ? '#22c55e' : '#71717a' }} />
                          {member.status === 'pending' ? 'Pending Confirmation' : isOnline ? 'Active • In Portal' : 'Offline'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        {isOnline ? (
                          <span style={{ fontSize: 12, color: '#e4e4e7', fontWeight: 600 }}>Active now</span>
                        ) : (
                          <div style={{ fontSize: 12, color: '#e4e4e7' }}>
                            <div>{presenceInfo.formatted}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({presenceInfo.relative})</div>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12.5, color: '#e4e4e7' }}>{member.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(member.id, member.email)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedEmailMap[member.id] ? '#10b981' : 'var(--text-subtle)',
                                cursor: 'pointer',
                                padding: 2
                              }}
                            >
                              {copiedEmailMap[member.id] ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                          {member.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{member.phone}</span>
                              <span style={{ fontSize: 9.5, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>Verified</span>
                            </div>
                          )}
                          {member.social_links && (member.social_links.github || member.social_links.instagram || member.social_links.linkedin || member.social_links.twitter) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                              {member.social_links.github && (
                                <a href={getSocialLink('github', member.social_links.github)} target="_blank" rel="noopener noreferrer" title="GitHub" style={{ color: '#a1a1aa', display: 'inline-flex' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.89 5.07 5.07 0 0 0-.14-3.83s-1.23-.4-4 1.44a13.38 13.38 0 0 0-7 0C4.23 1.28 3 1.68 3 1.68a5.07 5.07 0 0 0-.14 3.83 5.44 5.44 0 0 0-1.5 3.89c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 7 18v4"></path></svg>
                                </a>
                              )}
                              {member.social_links.instagram && (
                                <a href={getSocialLink('instagram', member.social_links.instagram)} target="_blank" rel="noopener noreferrer" title="Instagram" style={{ color: '#e1306c', display: 'inline-flex' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </a>
                              )}
                              {member.social_links.linkedin && (
                                <a href={getSocialLink('linkedin', member.social_links.linkedin)} target="_blank" rel="noopener noreferrer" title="LinkedIn" style={{ color: '#0a66c2', display: 'inline-flex' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                                </a>
                              )}
                              {member.social_links.twitter && (
                                <a href={getSocialLink('twitter', member.social_links.twitter)} target="_blank" rel="noopener noreferrer" title="X / Twitter" style={{ color: '#ffffff', display: 'inline-flex' }}>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleNotifyMember(member.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Bell size={12} />
                          <span>Notify</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{
            background: '#0d0d0f',
            border: '1px solid #27272a',
            borderRadius: 18,
            width: '100%',
            maxWidth: 450,
            padding: 26,
            position: 'relative',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.04)'
          }}>
            <button 
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              title="Close"
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1f1f23' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: '#161618',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                <UserPlus size={18} />
              </div>
              <div style={{ paddingRight: 36 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  Invite New Member
                </h3>
                <div style={{ fontSize: 12.5, color: '#71717a', marginTop: 3 }}>
                  Send an official access invitation to join the Ceova workspace
                </div>
              </div>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {message && (
                <div style={{ 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  background: isError ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                  border: `1px solid ${isError ? 'rgba(239, 68, 68, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                  color: isError ? '#ef4444' : '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5
                }}>
                  {isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                  <span>{message}</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #27272a',
                    background: '#121214',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Assigned Clearance Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #27272a',
                    background: '#121214',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="intern">Intern</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6, paddingTop: 16, borderTop: '1px solid #1f1f23' }}>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#222226';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#161618';
                    e.currentTarget.style.color = '#a1a1aa';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '9px 22px',
                    background: '#ffffff',
                    color: '#000000',
                    border: '1px solid #ffffff',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.background = '#e4e4e7';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <Send size={14} />
                  <span>{loading ? 'Sending...' : 'Send Invitation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
