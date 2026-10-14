import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { getSupabaseClient } from '../lib/supabase';
import { sanitizeSocialLink } from '../lib/security';
import { sendInvitationEmail } from '../lib/emailService';
import { 
  Users, 
  GraduationCap,
  Megaphone,
  Code2,
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
  Bell,
  User,
  ShieldAlert,
  PauseCircle,
  Trash2,
  UserCheck,
  Link as LinkIcon,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';
import { NavTab } from '../components/Sidebar';
import { UserAvatar } from '../components/UserAvatar';
import { getMemberCoverStyle } from '../lib/coverUtils';
import { Profile } from '../types';
import { MemberStatusModal } from '../components/MemberStatusModal';
import { AssignGroupModal } from '../components/AssignGroupModal';
import { CreateGroupModal } from '../components/CreateGroupModal';

export type MembersPart = 'members' | 'interns' | 'pending';

interface MembersViewProps {
  initialPart?: MembersPart;
  onNavigate?: (tab: NavTab) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ initialPart = 'members', onNavigate }) => {
  const { user: currentUser, isAdmin, savedAccounts } = useAuth();
  const { members, departments, refreshData, isLoadingData, updateMemberStatus, createGroup } = usePortalData();

  // View state: cards vs table and primary section (Members vs Interns vs Pending)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [activePart, setActivePart] = useState<MembersPart>(() => initialPart || 'members');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [pendingFilter, setPendingFilter] = useState<string>('all');

  useEffect(() => {
    if (initialPart) {
      setActivePart(initialPart);
    }
  }, [initialPart]);

  useEffect(() => {
    if (!isAdmin && activePart === 'pending') {
      setActivePart('members');
    }
  }, [isAdmin, activePart]);

  const handleSwitchPart = (part: MembersPart) => {
    setActivePart(part);
    setGroupFilter('all');
    if (onNavigate) {
      if (part === 'interns') onNavigate('interns');
      else if (part === 'members') onNavigate('members');
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedEmailMap, setCopiedEmailMap] = useState<{ [id: string]: boolean }>({});
  const [copiedInviteLinkMap, setCopiedInviteLinkMap] = useState<{ [id: string]: boolean }>({});
  const [actionLoadingMemberId, setActionLoadingMemberId] = useState<string | null>(null);

  // Bio and Skills expand/collapse toggles
  const [expandedBios, setExpandedBios] = useState<{ [id: string]: boolean }>({});
  const [expandedSkills, setExpandedSkills] = useState<{ [id: string]: boolean }>({});

  const toggleSkills = (memberId: string) => {
    setExpandedSkills(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  const toggleBio = (memberId: string) => {
    setExpandedBios(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  // Invite modal state with mandatory Group selection ('Marketing' | 'Development')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [statusModalMember, setStatusModalMember] = useState<Profile | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Admin Assign / Switch Group Modal state
  const [isAssignGroupModalOpen, setIsAssignGroupModalOpen] = useState(false);
  const [assignGroupTargetMember, setAssignGroupTargetMember] = useState<Profile | null>(null);

  // Admin Make Group Modal state
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'intern' | 'admin'>('member');
  const [group, setGroup] = useState<string>('Development');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Helper: Format social link URL safely
  const getSocialLink = (platform: string, rawValue?: string | null) => {
    return sanitizeSocialLink(platform, rawValue);
  };

  // One-click copy email
  const handleCopyEmail = (id: string, emailStr: string) => {
    if (!emailStr) return;
    const isTargetCurrent = Boolean(
      (currentUser?.id && id === currentUser.id) ||
      (currentUser?.email && emailStr && currentUser.email.toLowerCase() === emailStr.toLowerCase())
    );
    if (!isAdmin && !isTargetCurrent) return;
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

  // Resend invitation status tracking per email
  const [resendStatusMap, setResendStatusMap] = useState<{ [email: string]: { loading: boolean; message: string; isError: boolean } }>({});

  const handleResendInvitation = async (targetMember: Profile) => {
    const cleanEmail = targetMember.email?.trim().toLowerCase();
    if (!cleanEmail) return;

    setResendStatusMap(prev => ({
      ...prev,
      [cleanEmail]: { loading: true, message: 'Dispatching invitation email...', isError: false }
    }));

    try {
      const res = await sendInvitationEmail({
        to: cleanEmail,
        role: targetMember.role,
        department: targetMember.department || 'General',
        inviterName: currentUser?.full_name || 'CEOVA Administration',
      });

      if (res.success) {
        setResendStatusMap(prev => ({
          ...prev,
          [cleanEmail]: { loading: false, message: '✓ Invitation email dispatched! Check Inbox, Updates, or Spam.', isError: false }
        }));
      } else {
        setResendStatusMap(prev => ({
          ...prev,
          [cleanEmail]: { loading: false, message: res.error || 'Failed to send email.', isError: true }
        }));
      }
    } catch (err: any) {
      setResendStatusMap(prev => ({
        ...prev,
        [cleanEmail]: { loading: false, message: err?.message || 'Error sending invitation.', isError: true }
      }));
    }

    setTimeout(() => {
      setResendStatusMap(prev => {
        const next = { ...prev };
        delete next[cleanEmail];
        return next;
      });
    }, 5000);
  };

  // One-click copy invitation / portal link
  const handleCopyPortalLink = (id: string) => {
    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://portal.ceovaai.com';
    navigator.clipboard.writeText(portalUrl);
    setCopiedInviteLinkMap(prev => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setCopiedInviteLinkMap(prev => ({ ...prev, [id]: false }));
    }, 1800);
  };



  // Revoke / Cancel pending invitation
  const handleRevokeInvite = async (targetMember: Profile) => {
    const confirmMsg = `Are you sure you want to revoke the invitation for ${targetMember.full_name || targetMember.email}? This will cancel their invitation and remove them from the system.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingMemberId(targetMember.id);
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.from('profiles').delete().eq('id', targetMember.id);
        if (targetMember.email) {
          await supabase.from('invitations').delete().ilike('email', targetMember.email.trim());
        }
      }
      await refreshData();
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke invitation.');
    } finally {
      setActionLoadingMemberId(null);
    }
  };

  // Send invitation
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (!group || !group.trim()) {
        throw new Error('Please select or make a group for this intern.');
      }

      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase client is not configured.');

      const cleanEmail = email.trim().toLowerCase();
      const generatedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // 1. Check if profile already exists or generate a valid UUID
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      const profileId = existingProf?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'prof-' + Date.now());

      const computedDesignation = 
        role === 'admin' 
          ? 'Administrator' 
          : role === 'intern' 
            ? `${group} Intern` 
            : `${group} Specialist`;

      // 2. Add directly to profiles table with status 'pending' so member appears in list immediately
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: profileId,
          email: cleanEmail,
          full_name: generatedName,
          role: role,
          department: group,
          designation: computedDesignation,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], { onConflict: 'email' });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw new Error(profileError.message || 'Failed to save user profile.');
      }

      // 3. Also record in invitations table
      try {
        await supabase
          .from('invitations')
          .upsert([{ email: cleanEmail, role, department: group }], { onConflict: 'email' });
      } catch (_) {
        try {
          await supabase
            .from('invitations')
            .upsert([{ email: cleanEmail, role }], { onConflict: 'email' });
        } catch (_) {}
      }

      // 4. Send official workspace invitation email using improved template
      let emailDispatched = false;
      try {
        const emailRes = await sendInvitationEmail({
          to: cleanEmail,
          role,
          department: group,
          inviterName: currentUser?.full_name || 'CEOVA Administration',
        });
        emailDispatched = emailRes.success;
      } catch (emailErr) {
        console.warn('Invitation email notice:', emailErr);
      }

      if (emailDispatched) {
        setMessage(`✓ Invitation dispatched! ${cleanEmail} has been invited to ${group} (${role === 'intern' ? 'Intern' : 'Member'}).`);
      } else {
        setMessage(`Added to directory as ${role === 'intern' ? 'Intern' : 'Member'} (${group})! Note: You can resend their invitation email anytime.`);
      }

      setEmail('');
      setTimeout(() => {
        setIsInviteModalOpen(false);
        setMessage('');
        refreshData();
      }, 2500);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.message || 'Failed to add user.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically resolve all groups from departments, guaranteeing Development and Marketing are present
  const allAvailableGroups = useMemo(() => {
    const list = [...departments];
    if (!list.some(d => d.name.toLowerCase() === 'development')) {
      list.unshift({ id: 'dept-dev', name: 'Development', code: 'dev', description: 'Software engineering, tech, and architecture', color: '#3b82f6' });
    }
    if (!list.some(d => d.name.toLowerCase() === 'marketing')) {
      list.unshift({ id: 'dept-mkt', name: 'Marketing', code: 'mkt', description: 'Brand identity, growth, and campaigns', color: '#ec4899' });
    }
    return list;
  }, [departments]);

  // Current user's normalized department
  const userDept = useMemo(() => {
    return (currentUser?.department || '').trim().toLowerCase();
  }, [currentUser?.department]);

  // Admin can see every group; members can only see groups of their department
  const availableGroups = useMemo(() => {
    if (isAdmin) {
      return allAvailableGroups;
    }
    // Non-admin members can only see groups of their department
    if (!userDept || userDept === 'general' || userDept === 'unassigned') {
      const matches = allAvailableGroups.filter(g => g.name.toLowerCase() === userDept);
      return matches.length > 0 ? matches : allAvailableGroups;
    }
    const matched = allAvailableGroups.filter(g => {
      const gName = g.name.toLowerCase();
      return gName.includes(userDept) || userDept.includes(gName);
    });
    if (matched.length === 0) {
      return [{
        id: `dept-${userDept}`,
        name: currentUser?.department || 'My Department',
        code: userDept.slice(0, 3),
        description: `${currentUser?.department} Department`,
        color: '#3b82f6'
      }];
    }
    return matched;
  }, [isAdmin, allAvailableGroups, userDept, currentUser?.department]);

  // Active Pools (Admin sees all; members only see members/interns of their department)
  const activeTeamMembers = useMemo(() => {
    return members.filter(m => {
      if (m.status === 'pending' || m.role === 'intern') return false;
      if (!isAdmin && (m.status === 'blocked' || m.status === 'paused')) return false;
      if (!isAdmin && userDept && userDept !== 'general' && userDept !== 'unassigned') {
        const d = (m.department || '').toLowerCase();
        const isCur = Boolean(
          (currentUser?.id && m.id === currentUser.id) || 
          (currentUser?.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())
        );
        return d.includes(userDept) || userDept.includes(d) || isCur;
      }
      return true;
    });
  }, [members, isAdmin, userDept, currentUser]);

  const activeInterns = useMemo(() => {
    return members.filter(m => {
      if (m.status === 'pending' || m.role !== 'intern') return false;
      if (!isAdmin && (m.status === 'blocked' || m.status === 'paused')) return false;
      if (!isAdmin && userDept && userDept !== 'general' && userDept !== 'unassigned') {
        const d = (m.department || '').toLowerCase();
        const isCur = Boolean(
          (currentUser?.id && m.id === currentUser.id) || 
          (currentUser?.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())
        );
        return d.includes(userDept) || userDept.includes(d) || isCur;
      }
      return true;
    });
  }, [members, isAdmin, userDept, currentUser]);

  const pendingMembers = useMemo(() => {
    return members.filter(m => m.status === 'pending' && m.role !== 'intern');
  }, [members]);

  const pendingInterns = useMemo(() => {
    return members.filter(m => m.status === 'pending' && m.role === 'intern');
  }, [members]);

  const allPending = useMemo(() => {
    return members.filter(m => m.status === 'pending');
  }, [members]);

  // Dynamic group counts for active members or interns
  const groupStats = useMemo(() => {
    const targetPool = activePart === 'interns' ? activeInterns : activeTeamMembers;
    return availableGroups.map(g => {
      const gNameLower = g.name.toLowerCase();
      const count = targetPool.filter(m => {
        const d = (m.department || '').toLowerCase();
        return d.includes(gNameLower) || gNameLower.includes(d);
      }).length;
      return {
        ...g,
        count
      };
    });
  }, [availableGroups, activePart, activeInterns, activeTeamMembers]);

  // Group counts for Members
  const marketingMembersCount = useMemo(() => {
    return activeTeamMembers.filter(m => (m.department || '').toLowerCase().includes('market')).length;
  }, [activeTeamMembers]);

  const devMembersCount = useMemo(() => {
    return activeTeamMembers.filter(m => (m.department || '').toLowerCase().includes('dev')).length;
  }, [activeTeamMembers]);

  // Group counts for Interns
  const marketingInternsCount = useMemo(() => {
    return activeInterns.filter(m => (m.department || '').toLowerCase().includes('market')).length;
  }, [activeInterns]);

  const devInternsCount = useMemo(() => {
    return activeInterns.filter(m => (m.department || '').toLowerCase().includes('dev')).length;
  }, [activeInterns]);

  // Unassigned detection: Members/Interns without a recognized department group
  const isUnassignedMember = (m: Profile) => {
    const isCeo = (m.designation || '').toLowerCase().includes('ceo') || (m.designation || '').toLowerCase().includes('founder');
    if (isCeo) return false;
    const dept = (m.department || '').toLowerCase().trim();
    if (!dept || dept === 'general' || dept === 'unassigned' || dept === 'internship') return true;
    return !allAvailableGroups.some(g => dept.includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(dept));
  };

  const unassignedMembers = useMemo(() => {
    return members.filter(m => isUnassignedMember(m));
  }, [members, allAvailableGroups]);

  const unassignedInCurrentPart = useMemo(() => {
    return unassignedMembers.filter(m => {
      if (activePart === 'interns') return m.role === 'intern' && m.status !== 'pending';
      if (activePart === 'pending') return m.status === 'pending';
      return m.role !== 'intern' && m.status !== 'pending';
    });
  }, [unassignedMembers, activePart]);

  // Auto-prompt popup modal for admin once per session if unassigned members exist
  useEffect(() => {
    if (isAdmin && unassignedMembers.length > 0 && !isLoadingData) {
      const alreadyPrompted = sessionStorage.getItem('ceova_prompted_unassigned_groups');
      if (!alreadyPrompted) {
        sessionStorage.setItem('ceova_prompted_unassigned_groups', 'true');
        setAssignGroupTargetMember(unassignedMembers[0]);
        setIsAssignGroupModalOpen(true);
      }
    }
  }, [isAdmin, unassignedMembers, isLoadingData]);

  // Filtered members list with all rich profile attributes merged
  const filteredMembers = useMemo(() => {
    return members.map((rawMember) => {
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
      if (!isAdmin && (m.status === 'blocked' || m.status === 'paused')) {
        return false;
      }

      // 1. Part check
      if (activePart === 'pending') {
        if (m.status !== 'pending') return false;
        if (pendingFilter === 'members' && m.role === 'intern') return false;
        if (pendingFilter === 'interns' && m.role !== 'intern') return false;
        if (pendingFilter === 'unassigned' && !isUnassignedMember(m)) return false;
        if (pendingFilter !== 'all' && pendingFilter !== 'members' && pendingFilter !== 'interns' && pendingFilter !== 'unassigned') {
          const dept = (m.department || '').toLowerCase();
          const target = pendingFilter.toLowerCase();
          if (!dept.includes(target) && !target.includes(dept)) return false;
        }
      } else if (activePart === 'interns') {
        if (m.status === 'pending' || m.role !== 'intern') return false;
        if (groupFilter === 'unassigned') {
          if (!isUnassignedMember(m)) return false;
        } else if (groupFilter !== 'all') {
          const dept = (m.department || '').toLowerCase();
          const target = groupFilter.toLowerCase();
          if (!dept.includes(target) && !target.includes(dept)) return false;
        }
      } else {
        // 'members' part
        if (m.status === 'pending' || m.role === 'intern') return false;
        if (groupFilter === 'unassigned') {
          if (!isUnassignedMember(m)) return false;
        } else if (groupFilter !== 'all') {
          const dept = (m.department || '').toLowerCase();
          const target = groupFilter.toLowerCase();
          if (!dept.includes(target) && !target.includes(dept)) return false;
        }
      }

      // 2. Department restriction for regular members/interns:
      // Admins see everyone across all groups; members only see groups/people of their department
      if (!isAdmin && userDept && userDept !== 'general' && userDept !== 'unassigned') {
        const memberDept = (m.department || '').toLowerCase();
        const isCur = Boolean(
          (currentUser?.id && m.id === currentUser.id) || 
          (currentUser?.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())
        );
        const matchesUserDept = memberDept.includes(userDept) || userDept.includes(memberDept);
        if (!matchesUserDept && !isCur) {
          return false;
        }
      }

      const isCur = Boolean(
        (currentUser?.id && m.id === currentUser.id) || 
        (currentUser?.email && m.email && currentUser.email.toLowerCase() === m.email.toLowerCase())
      );
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q || 
        (m.full_name || '').toLowerCase().includes(q) || 
        ((isAdmin || isCur) && (m.email || '').toLowerCase().includes(q)) || 
        ((isAdmin || isCur) && (m.phone || '').toLowerCase().includes(q)) || 
        (m.designation || '').toLowerCase().includes(q) ||
        (m.department || '').toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [members, currentUser, savedAccounts, searchQuery, activePart, groupFilter, pendingFilter, isAdmin, userDept]);


  return (
    <div className="view-container fade-in" style={{ paddingBottom: 48 }}>
      {/* Top Header */}
      <div className="panel-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div className="panel-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#161618',
              border: activePart === 'interns' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activePart === 'interns' ? '#fbbf24' : '#ffffff'
            }}>
              {activePart === 'interns' ? <GraduationCap size={22} /> : activePart === 'pending' ? <Mail size={20} /> : <Users size={20} />}
            </div>
            <div>
              <h2 className="neo-serif-title" style={{ fontSize: 24, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                {activePart === 'interns' ? 'Interns Workspace' : activePart === 'pending' ? 'Pending Invitations' : 'Team Members'}
              </h2>
              <div style={{ fontSize: 12.5, color: '#a1a1aa', marginTop: 3 }}>
                {activePart === 'interns'
                  ? (!isAdmin && currentUser?.department
                      ? `Active interns in your ${currentUser.department} group`
                      : 'Active interns collaborating across workspace groups')
                  : activePart === 'pending'
                    ? 'Pending activations and sent workspace invitations'
                    : (!isAdmin && currentUser?.department
                        ? `Core team members in your ${currentUser.department} department`
                        : 'Core team members and workspace leaders across all groups')}
              </div>
            </div>
          </div>
        </div>

        <div className="ceova-members-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

          {isAdmin && unassignedMembers.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setAssignGroupTargetMember(unassignedMembers[0]);
                setIsAssignGroupModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#fbbf24',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 10px rgba(245, 158, 11, 0.15)'
              }}
              title="Pop-up modal to assign members and interns to Marketing or Development"
            >
              <FolderPlus size={15} />
              <span>Assign Groups ({unassignedMembers.length})</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <FolderPlus size={15} style={{ color: '#fbbf24' }} />
              <span>{activePart === 'interns' ? 'Make Intern Group' : 'Make Group'}</span>
            </button>
          )}

          {isAdmin && (
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setRole(activePart === 'interns' ? 'intern' : 'member');
                setGroup(availableGroups[0]?.name || 'Development');
                setMessage('');
                setIsError(false);
                setIsInviteModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 8,
                background: activePart === 'interns' ? '#f59e0b' : '#ffffff',
                color: '#000000',
                border: activePart === 'interns' ? '1px solid #f59e0b' : '1px solid #ffffff'
              }}
            >
              {activePart === 'interns' ? <GraduationCap size={15} /> : <UserPlus size={15} />}
              <span>{activePart === 'interns' ? 'Invite Intern' : activePart === 'pending' ? 'Invite User' : 'Invite Member'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Two Different Parts Navigation: Members vs Interns (+ Pending for Admin) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 18,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: 14,
        overflowX: 'auto'
      }}>
        {/* Part 1: Members */}
        <button
          type="button"
          onClick={() => handleSwitchPart('members')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: activePart === 'members' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activePart === 'members' ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
            color: activePart === 'members' ? '#000000' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={15} />
          <span>Members</span>
          <span style={{
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: activePart === 'members' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)',
            color: activePart === 'members' ? '#000000' : 'var(--text-subtle)'
          }}>
            {activeTeamMembers.length}
          </span>
        </button>

        {/* Part 2: Interns */}
        <button
          type="button"
          onClick={() => handleSwitchPart('interns')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            borderRadius: 8,
            border: activePart === 'interns' ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.08)',
            background: activePart === 'interns' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            color: activePart === 'interns' ? '#fbbf24' : 'var(--text-muted)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap'
          }}
        >
          <GraduationCap size={15} />
          <span>Interns</span>
          <span style={{
            padding: '2px 7px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: activePart === 'interns' ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
            color: activePart === 'interns' ? '#000000' : '#fbbf24'
          }}>
            {activeInterns.length}
          </span>
        </button>

        {/* Part 3: Pending Invitations (Admin only) */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => handleSwitchPart('pending')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 18px',
              borderRadius: 8,
              border: activePart === 'pending' ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
              background: activePart === 'pending' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.04)',
              color: activePart === 'pending' ? '#fbbf24' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Mail size={15} />
            <span>Pending Invitations &amp; Unactivated</span>
            <span style={{
              padding: '2px 7px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              background: activePart === 'pending' ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)',
              color: activePart === 'pending' ? '#000000' : '#fbbf24'
            }}>
              {allPending.length}
            </span>
          </button>
        )}
      </div>

      {/* Admin Attention Banner: Unassigned Members/Interns Prompt */}
      {isAdmin && unassignedMembers.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.14) 0%, rgba(236, 72, 153, 0.08) 100%)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(234, 179, 8, 0.22)',
              border: '1px solid rgba(234, 179, 8, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>Action Required: {unassignedMembers.length} {unassignedMembers.length === 1 ? 'person is' : 'people are'} not in any group</span>
                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 6, background: '#f59e0b', color: '#000000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ADMIN POPUP
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#d4d4d8', marginTop: 3 }}>
                Ceova organizes all members and interns into <strong>Marketing</strong> or <strong>Development</strong>. Assign their group to ensure access to channels, meetings, and materials.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setAssignGroupTargetMember(unassignedMembers[0]);
                setIsAssignGroupModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 20px',
                borderRadius: 8,
                background: '#f59e0b',
                color: '#000000',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <FolderPlus size={16} />
              <span>Select &amp; Assign Groups ({unassignedMembers.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Live Presence & Group Metrics Summary Bar */}
      <div style={{
        background: '#0d0d0f',
        border: '1px solid #222225',
        borderRadius: 14,
        padding: '14px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* Total Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
              {activePart === 'interns' ? activeInterns.length : activePart === 'members' ? activeTeamMembers.length : allPending.length} {activePart === 'interns' ? 'Interns' : activePart === 'members' ? 'Members' : 'Pending'} {!isAdmin && currentUser?.department ? `(${currentUser.department})` : 'Total'}
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: '#27272a' }} />

          {/* Groups list */}
          {groupStats.map((g) => {
            const groupColor = g.color || '#3b82f6';
            return (
              <React.Fragment key={g.id || g.name}>
                <div style={{ width: 1, height: 16, background: '#27272a' }} />
                <div 
                  onClick={() => setGroupFilter(groupFilter.toLowerCase() === g.name.toLowerCase() ? 'all' : g.name)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    cursor: 'pointer',
                    opacity: groupFilter !== 'all' && groupFilter.toLowerCase() !== g.name.toLowerCase() ? 0.6 : 1,
                    transition: 'opacity 0.15s ease'
                  }}
                  title={`Click to filter by ${g.name}`}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: groupColor }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: groupColor }}>
                    {g.count} {g.name}
                  </span>
                </div>
              </React.Fragment>
            );
          })}

          {/* Unassigned Chip in Summary Bar (Admin only) */}
          {isAdmin && unassignedInCurrentPart.length > 0 && (
            <>
              <div style={{ width: 1, height: 16, background: '#27272a' }} />
              <button
                type="button"
                onClick={() => {
                  if (isAdmin) {
                    setAssignGroupTargetMember(unassignedInCurrentPart[0]);
                    setIsAssignGroupModalOpen(true);
                  } else {
                    setGroupFilter('unassigned');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <AlertTriangle size={13} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#fbbf24' }}>
                  {unassignedInCurrentPart.length} Unassigned
                </span>
                {isAdmin && <span style={{ fontSize: 11, color: '#fbbf24', textDecoration: 'underline' }}>• Pop-up →</span>}
              </button>
            </>
          )}
        </div>

        {isAdmin && allPending.length > 0 && activePart !== 'pending' && (
          <button
            type="button"
            onClick={() => handleSwitchPart('pending')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '5px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              color: '#fbbf24',
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <Clock size={13} />
            <span>{allPending.length} Pending Setup &amp; Invitations</span>
            <span style={{ fontSize: 11, textDecoration: 'underline' }}>View →</span>
          </button>
        )}
      </div>

      {/* Banner for Pending Invitations Tab */}
      {activePart === 'pending' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0
            }}>
              <Mail size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                Pending Invitations &amp; Unactivated Accounts ({allPending.length})
              </div>
              <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>
                {pendingMembers.length} Members • {pendingInterns.length} Interns awaiting activation. You can resend invitations or copy portal links directly.
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setRole('member');
                setGroup('Development');
                setMessage('');
                setIsError(false);
                setIsInviteModalOpen(true);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              <UserPlus size={14} />
              <span>Invite New User</span>
            </button>
          )}
        </div>
      )}

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
            placeholder={activePart === 'interns' ? "Search intern, group, email..." : "Search member, group, email..."}
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

        {/* Group Filter Chips: Marketing vs Development */}
        {activePart !== 'pending' ? (
          <div className="ceova-filter-scroll-row ceova-hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
              Group:
            </span>
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: groupFilter === 'all' ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                background: groupFilter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: groupFilter === 'all' ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {isAdmin ? 'All Groups' : 'All'} ({activePart === 'interns' ? activeInterns.length : activeTeamMembers.length})
            </button>

            {groupStats.map((g) => {
              const isSelected = groupFilter.toLowerCase() === g.name.toLowerCase();
              const groupColor = g.color || '#3b82f6';
              return (
                <button
                  key={g.id || g.name}
                  type="button"
                  onClick={() => setGroupFilter(isSelected ? 'all' : g.name)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: isSelected ? `1px solid ${groupColor}` : `1px solid ${groupColor}35`,
                    background: isSelected ? `${groupColor}25` : 'transparent',
                    color: isSelected ? '#ffffff' : groupColor,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: groupColor }} />
                  <span>{g.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: `${groupColor}30`,
                    color: groupColor
                  }}>
                    {g.count}
                  </span>
                </button>
              );
            })}

            {isAdmin && unassignedInCurrentPart.length > 0 && (
              <button
                type="button"
                onClick={() => setGroupFilter('unassigned')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: groupFilter === 'unassigned' ? '1px solid #fbbf24' : '1px solid rgba(245, 158, 11, 0.3)',
                  background: groupFilter === 'unassigned' ? 'rgba(245, 158, 11, 0.22)' : 'transparent',
                  color: groupFilter === 'unassigned' ? '#fbbf24' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <AlertTriangle size={12} color="#fbbf24" />
                <span>Unassigned</span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: 'rgba(245, 158, 11, 0.3)',
                  color: '#fbbf24'
                }}>
                  {unassignedInCurrentPart.length}
                </span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsCreateGroupModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px dashed #3f3f46',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#fbbf24',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <FolderPlus size={12} />
                <span>+ Make Group</span>
              </button>
            )}
          </div>
        ) : (
          /* Pending Tab Filter Buttons */
          <div className="ceova-filter-scroll-row ceova-hide-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}>
            {(['all', 'members', 'interns', 'marketing', 'development', 'unassigned'] as const).map((pf) => (
              <button
                key={pf}
                type="button"
                onClick={() => setPendingFilter(pf)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: pendingFilter === pf ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                  background: pendingFilter === pf ? 'rgba(245, 158, 11, 0.16)' : 'transparent',
                  color: pendingFilter === pf ? '#fbbf24' : 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {pf === 'all' 
                  ? `All Pending (${allPending.length})` 
                  : pf === 'members' 
                    ? `Members (${pendingMembers.length})` 
                    : pf === 'interns' 
                      ? `Interns (${pendingInterns.length})` 
                      : pf === 'marketing' 
                        ? 'Marketing Group' 
                        : pf === 'development'
                          ? 'Development Group'
                          : `Unassigned (${allPending.filter(m => !(m.department || '').toLowerCase().includes('market') && !(m.department || '').toLowerCase().includes('dev')).length})`}
              </button>
            ))}
          </div>
        )}
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
          <p style={{ margin: 0, fontSize: 14 }}>Loading directory...</p>
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
          {activePart === 'pending' ? (
            <>
              <Mail size={36} style={{ margin: '0 auto 12px', color: '#fbbf24', opacity: 0.8 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                {searchQuery ? 'No matching pending invitations found' : 'No pending invitations'}
              </p>
              <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--text-subtle)' }}>
                {searchQuery 
                  ? 'Try adjusting your search query or group filter.' 
                  : 'All invited members and interns have activated their accounts.'}
              </p>
              {isAdmin && !searchQuery && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setRole('member');
                    setGroup('Development');
                    setMessage('');
                    setIsError(false);
                    setIsInviteModalOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8
                  }}
                >
                  <UserPlus size={15} />
                  <span>Invite User</span>
                </button>
              )}
            </>
          ) : activePart === 'interns' ? (
            <>
              <GraduationCap size={36} style={{ margin: '0 auto 12px', color: '#fbbf24', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>No interns found</p>
              <p style={{ margin: '6px 0 16px', fontSize: 13, color: 'var(--text-subtle)' }}>
                {searchQuery || groupFilter !== 'all' 
                  ? 'Try adjusting your search or group filter.' 
                  : 'No interns currently registered. Admins can make a group and invite new interns.'}
              </p>
              {isAdmin && !searchQuery && groupFilter === 'all' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setRole('intern');
                    setGroup(availableGroups[0]?.name || 'Development');
                    setMessage('');
                    setIsError(false);
                    setIsInviteModalOpen(true);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: '#f59e0b',
                    color: '#000000',
                    border: '1px solid #f59e0b'
                  }}
                >
                  <GraduationCap size={15} />
                  <span>Invite First Intern</span>
                </button>
              )}
            </>
          ) : (
            <>
              <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#ffffff' }}>No team members found</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-subtle)' }}>
                Try adjusting your search query or group filter.
              </p>
            </>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="ceova-members-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
          gap: 18
        }}>
          {filteredMembers.map((member) => {
            const isCurrent = Boolean(
              (currentUser?.id && member.id === currentUser.id) ||
              (currentUser?.email && member.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
            );
            const canViewContact = Boolean(isAdmin || isCurrent);
            const isAdminRole = member.role === 'admin' || member.role === 'ceo';
            const isInternRole = member.role === 'intern';
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
                {/* 1. Card Top Cover Banner - 16:9 Aspect Ratio with Executive Presets & Proxied Images */}
                {(() => {
                  const coverStyle = getMemberCoverStyle(member);
                  return (
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      position: 'relative',
                      backgroundColor: coverStyle.backgroundColor,
                      backgroundImage: coverStyle.backgroundImage,
                      backgroundPosition: 'center',
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat',
                      borderBottom: '1px solid #222225',
                      overflow: 'hidden'
                    }}>
                      {/* Modern High-Tech Grid Pattern Overlay */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                        opacity: coverStyle.isCustom ? 0.18 : 0.45,
                        pointerEvents: 'none'
                      }} />
                      {/* Bottom Gradient Fade into Card */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '45%',
                        background: 'linear-gradient(to top, rgba(13, 13, 15, 0.88) 0%, transparent 100%)',
                        pointerEvents: 'none'
                      }} />
                  {/* Top Right Role & Group Pills */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {/* Group Badge: Marketing vs Development vs Unassigned */}
                    {(() => {
                      const deptLower = (member.department || '').toLowerCase();
                      const isMarketing = deptLower.includes('market');
                      const isDev = deptLower.includes('dev');
                      const isCeo = (member.designation || '').toLowerCase().includes('ceo') || (member.designation || '').toLowerCase().includes('founder');

                      if (!isMarketing && !isDev && !isCeo) {
                        return (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAdmin) {
                                setAssignGroupTargetMember(member);
                                setIsAssignGroupModalOpen(true);
                              }
                            }}
                            title={isAdmin ? "Click to assign Marketing or Development group" : "No group assigned"}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'rgba(245, 158, 11, 0.25)',
                              border: '1px solid rgba(245, 158, 11, 0.55)',
                              color: '#fbbf24',
                              cursor: isAdmin ? 'pointer' : 'default',
                              textTransform: 'uppercase',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <AlertTriangle size={10} />
                            <span>{isAdmin ? 'NO GROUP • ASSIGN' : 'NO GROUP'}</span>
                          </button>
                        );
                      }

                      if (!member.department && !isMarketing && !isDev) return null;

                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdmin) {
                              setAssignGroupTargetMember(member);
                              setIsAssignGroupModalOpen(true);
                            }
                          }}
                          title={isAdmin ? "Click to change group assignment" : undefined}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: isMarketing 
                              ? 'rgba(236, 72, 153, 0.22)' 
                              : isDev 
                                ? 'rgba(59, 130, 246, 0.22)' 
                                : '#1c1c1f',
                            border: isMarketing 
                              ? '1px solid rgba(236, 72, 153, 0.45)' 
                              : isDev 
                                ? '1px solid rgba(59, 130, 246, 0.45)' 
                                : '1px solid #2e2e33',
                            color: isMarketing ? '#f472b6' : isDev ? '#60a5fa' : '#a1a1aa',
                            textTransform: 'uppercase',
                            cursor: isAdmin ? 'pointer' : 'default'
                          }}
                        >
                          {isMarketing ? <Megaphone size={10} /> : isDev ? <Code2 size={10} /> : null}
                          <span>{isMarketing ? 'MARKETING' : isDev ? 'DEVELOPMENT' : member.department}</span>
                          {isAdmin && <ChevronDown size={10} style={{ opacity: 0.6 }} />}
                        </button>
                      );
                    })()}

                    {/* Role Pill */}
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
                          ? 'rgba(245, 158, 11, 0.18)' 
                          : '#1c1c1f',
                      border: isAdminRole 
                        ? '1px solid #3f3f46' 
                        : isInternRole 
                          ? '1px solid rgba(245, 158, 11, 0.35)' 
                          : '1px solid #2e2e33',
                      color: isAdminRole ? '#ffffff' : isInternRole ? '#fbbf24' : '#e4e4e7',
                      textTransform: 'uppercase'
                    }}>
                      {isInternRole ? <GraduationCap size={11} /> : <Shield size={10} />}
                      {isAdminRole ? 'ADMIN' : isInternRole ? 'INTERN' : 'MEMBER'}
                    </span>
                  </div>
                </div>
                  );
                })()}

                {/* 2. Card Body Content */}
                <div style={{ padding: '0 18px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Avatar & Online Dot */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 14 }}>
                    <div>
                      <UserAvatar
                        src={member.avatar_url}
                        name={member.full_name}
                        size={68}
                        fontSize={24}
                        border="3px solid #0d0d0f"
                        style={{
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
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
                        {member.role === 'intern' 
                          ? (member.designation && member.designation !== 'Team Member' ? member.designation : 'Intern') 
                          : (member.designation || 'Team Member')} • {member.role === 'intern' && (!member.department || member.department === 'General') ? 'Internship' : (member.department || 'General')}
                      </span>
                    </div>
                  </div>

                  {/* Status Box for Pending Invitations */}
                  {member.status === 'pending' && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      marginBottom: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 11.5,
                      color: '#fbbf24'
                    }}>
                      <Clock size={12} style={{ flexShrink: 0 }} />
                      <span>Pending setup confirmation</span>
                    </div>
                  )}

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
                  {canViewContact ? (
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
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 6,
                      border: '1px dashed rgba(255, 255, 255, 0.08)',
                      marginBottom: 12,
                      color: 'var(--text-subtle)',
                      fontSize: 11
                    }}>
                      <Lock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      <span>Contact details restricted to Admin</span>
                    </div>
                  )}

                  {/* 6. Bio & Overview Snippet (Shown if added!) */}
                  {member.bio && (() => {
                    const isBioExpanded = Boolean(expandedBios[member.id]);
                    const isBioLong = member.bio.trim().length > 80 || member.bio.includes('\n');
                    return (
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FileText size={10} />
                            <span>Bio</span>
                          </div>
                          {isBioLong && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBio(member.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#60a5fa',
                                fontSize: 10,
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '0 2px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#93c5fd'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#60a5fa'}
                              title={isBioExpanded ? 'Collapse Bio' : 'Expand Bio'}
                            >
                              <span>{isBioExpanded ? 'Show less' : 'Show more'}</span>
                              {isBioExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            </button>
                          )}
                        </div>
                        <div style={{
                          overflow: isBioExpanded ? 'visible' : 'hidden',
                          textOverflow: isBioExpanded ? 'clip' : 'ellipsis',
                          display: isBioExpanded ? 'block' : '-webkit-box',
                          WebkitLineClamp: isBioExpanded ? 'unset' : 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-line'
                        }}>
                          {member.bio}
                        </div>

                      </div>
                    );
                  })()}

                  {/* 7. Skills & Specializations Chips (Shown if added!) */}
                  {member.skills && Array.isArray(member.skills) && member.skills.length > 0 && (() => {
                    const isSkillsExpanded = Boolean(expandedSkills[member.id]);
                    const SKILLS_LIMIT = 4;
                    const hasMoreSkills = member.skills.length > SKILLS_LIMIT;
                    const displayedSkills = isSkillsExpanded ? member.skills : member.skills.slice(0, SKILLS_LIMIT);

                    return (
                      <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-subtle)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                          <Sparkles size={10} />
                          <span>Skills</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                          {displayedSkills.map((skill: string, idx: number) => (
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

                          {hasMoreSkills && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSkills(member.id);
                              }}
                              style={{
                                fontSize: 10.5,
                                padding: '2px 9px',
                                background: isSkillsExpanded ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                border: isSkillsExpanded ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: 100,
                                color: isSkillsExpanded ? '#93c5fd' : '#60a5fa',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontWeight: 600,
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = isSkillsExpanded ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.12)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = isSkillsExpanded ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.06)';
                              }}
                            >
                              <span>{isSkillsExpanded ? 'Show less' : `+${member.skills.length - SKILLS_LIMIT} Show more`}</span>
                              {isSkillsExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                                    {/* Action Buttons */}
                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {member.status === 'pending' ? (
                      /* Dedicated Actions for Pending Invitations */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Copy Portal Access Link Bar */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#121214',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11.5
                        }}>
                          <span style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <LinkIcon size={12} color="#60a5fa" />
                            <span>portal.ceovaai.com</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPortalLink(member.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedInviteLinkMap[member.id] ? '#4ade80' : '#60a5fa',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            {copiedInviteLinkMap[member.id] ? <Check size={11} /> : <Copy size={11} />}
                            <span>{copiedInviteLinkMap[member.id] ? 'Copied' : 'Copy Link'}</span>
                          </button>
                        </div>

                        {/* Resend Invitation Email */}
                        <button
                          type="button"
                          onClick={() => handleResendInvitation(member)}
                          disabled={resendStatusMap[member.email?.toLowerCase()]?.loading}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '8px 12px',
                            borderRadius: 8,
                            background: '#16a34a',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: resendStatusMap[member.email?.toLowerCase()]?.loading ? 'wait' : 'pointer',
                            boxShadow: '0 2px 10px rgba(22, 163, 74, 0.3)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#15803d'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#16a34a'}
                        >
                          <Mail size={13} />
                          <span>{resendStatusMap[member.email?.toLowerCase()]?.loading ? 'Dispatching Email...' : 'Resend Invitation Email'}</span>
                        </button>

                        {resendStatusMap[member.email?.toLowerCase()] && (
                          <div
                            style={{
                              fontSize: 11,
                              textAlign: 'center',
                              padding: '5px 8px',
                              borderRadius: 6,
                              background: resendStatusMap[member.email?.toLowerCase()].isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                              border: resendStatusMap[member.email?.toLowerCase()].isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                              color: resendStatusMap[member.email?.toLowerCase()].isError ? '#f87171' : '#4ade80',
                            }}
                          >
                            {resendStatusMap[member.email?.toLowerCase()].message}
                          </div>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(member)}
                            disabled={actionLoadingMemberId === member.id}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              padding: '7px 8px',
                              borderRadius: 8,
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: actionLoadingMemberId === member.id ? 'wait' : 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Cancel this invitation and remove this user from pending list"
                          >
                            <Trash2 size={12} />
                            <span>Revoke</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignGroupTargetMember(member);
                              setIsAssignGroupModalOpen(true);
                            }}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 5,
                              padding: '7px 8px',
                              borderRadius: 8,
                              background: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                ? '1px solid rgba(245, 158, 11, 0.45)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              color: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                ? '#fbbf24'
                                : '#d4d4d8',
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginTop: 6
                            }}
                          >
                            <FolderPlus size={12} />
                            <span>{(!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev'))) ? 'Assign Group (Popup)' : 'Edit Group / Role'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleNotifyMember(member.id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#a1a1aa',
                            fontSize: 11.5,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <Bell size={12} />
                          <span>Send Direct Notification</span>
                        </button>
                      </div>
                    ) : isCurrent ? (
                      <button
                        type="button"
                        onClick={() => onNavigate && onNavigate('profile')}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '7px 12px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                      >
                        <User size={13} />
                        <span>Edit My Profile</span>
                      </button>
                    ) : (
                      <>
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
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                        >
                          <Bell size={13} />
                          <span>Send Notification</span>
                        </button>

                        {isAdmin && (
                          <div style={{ marginTop: 8 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setStatusModalMember(member);
                                setIsStatusModalOpen(true);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                background: (member.status === 'blocked' || member.status === 'paused') ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                                border: (member.status === 'blocked' || member.status === 'paused') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)',
                                color: (member.status === 'blocked' || member.status === 'paused') ? '#4ade80' : '#f87171',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {(member.status === 'blocked' || member.status === 'paused') ? (
                                <>
                                  <CheckCircle2 size={12} />
                                  <span>Reactivate Access</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert size={12} />
                                  <span>Pause / Block Access</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setAssignGroupTargetMember(member);
                                setIsAssignGroupModalOpen(true);
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 8,
                                marginTop: 6,
                                background: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : 'rgba(255, 255, 255, 0.05)',
                                border: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                  ? '1px solid rgba(245, 158, 11, 0.45)'
                                  : '1px solid rgba(255, 255, 255, 0.1)',
                                color: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                  ? '#fbbf24'
                                  : '#d4d4d8',
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <FolderPlus size={12} />
                              <span>{(!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev'))) ? 'Assign Group (Popup)' : 'Edit Group / Role'}</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
                  {activePart === 'pending' && (
                    <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal Setup Link</th>
                  )}
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact & Links</th>
                  <th style={{ padding: '14px 20px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const isCurrent = Boolean(
                    (currentUser?.id && member.id === currentUser.id) ||
                    (currentUser?.email && member.email && currentUser.email.toLowerCase() === member.email.toLowerCase())
                  );
                  const canViewContact = Boolean(isAdmin || isCurrent);
                  const isAdminRole = member.role === 'admin' || member.role === 'ceo';
                  const isInternRole = member.role === 'intern';

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
                          <UserAvatar
                            src={member.avatar_url}
                            name={member.full_name}
                            size={38}
                            fontSize={15}
                            border={member.status === 'pending' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)'}
                          />
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isAdminRole ? '#27272a' : isInternRole ? 'rgba(245, 158, 11, 0.18)' : '#1c1c1f',
                            border: isAdminRole ? '1px solid #3f3f46' : isInternRole ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #2e2e33',
                            color: isAdminRole ? '#ffffff' : isInternRole ? '#fbbf24' : '#e4e4e7',
                            textTransform: 'uppercase'
                          }}>
                            {isInternRole ? <GraduationCap size={11} /> : <Shield size={10} />}
                            {isAdminRole ? 'ADMIN' : isInternRole ? 'INTERN' : 'MEMBER'}
                          </span>

                          {(() => {
                            const deptLower = (member.department || '').toLowerCase();
                            const isMarketing = deptLower.includes('market');
                            const isDev = deptLower.includes('dev');
                            const isCeo = (member.designation || '').toLowerCase().includes('ceo') || (member.designation || '').toLowerCase().includes('founder');

                            if (!isMarketing && !isDev && !isCeo) {
                              return (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isAdmin) {
                                      setAssignGroupTargetMember(member);
                                      setIsAssignGroupModalOpen(true);
                                    }
                                  }}
                                  title={isAdmin ? "Click to assign Marketing or Development group" : "No group assigned"}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    border: '1px solid rgba(245, 158, 11, 0.45)',
                                    color: '#fbbf24',
                                    cursor: isAdmin ? 'pointer' : 'default',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <AlertTriangle size={10} />
                                  <span>{isAdmin ? 'NO GROUP • ASSIGN' : 'NO GROUP'}</span>
                                </button>
                              );
                            }

                            if (!member.department && !isMarketing && !isDev) return null;
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isAdmin) {
                                    setAssignGroupTargetMember(member);
                                    setIsAssignGroupModalOpen(true);
                                  }
                                }}
                                title={isAdmin ? "Click to change group assignment" : undefined}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: isMarketing ? 'rgba(236, 72, 153, 0.2)' : isDev ? 'rgba(59, 130, 246, 0.2)' : '#1c1c1f',
                                  border: isMarketing ? '1px solid rgba(236, 72, 153, 0.4)' : isDev ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid #2e2e33',
                                  color: isMarketing ? '#f472b6' : isDev ? '#60a5fa' : '#a1a1aa',
                                  textTransform: 'uppercase',
                                  cursor: isAdmin ? 'pointer' : 'default'
                                }}
                              >
                                {isMarketing ? <Megaphone size={10} /> : isDev ? <Code2 size={10} /> : null}
                                <span>{isMarketing ? 'MARKETING' : isDev ? 'DEVELOPMENT' : member.department}</span>
                                {isAdmin && <ChevronDown size={10} style={{ opacity: 0.6 }} />}
                              </button>
                            );
                          })()}
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
                          background: member.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : member.status === 'blocked' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          border: member.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.3)' : member.status === 'blocked' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                          color: member.status === 'pending' ? '#fbbf24' : member.status === 'blocked' ? '#ef4444' : '#22c55e'
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: member.status === 'pending' ? '#f59e0b' : member.status === 'blocked' ? '#ef4444' : '#22c55e' }} />
                          {member.status === 'pending' ? 'Pending Activation' : member.status === 'blocked' ? 'Blocked' : 'Active'}
                        </span>
                      </td>

                      {activePart === 'pending' && (
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#161618', border: '1px solid #27272a', padding: '4px 10px', borderRadius: 6 }}>
                            <LinkIcon size={12} color="#60a5fa" />
                            <span style={{ fontSize: 11.5, color: '#e4e4e7' }}>portal.ceovaai.com</span>
                            <button
                              type="button"
                              onClick={() => handleCopyPortalLink(member.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: copiedInviteLinkMap[member.id] ? '#10b981' : 'var(--text-subtle)',
                                cursor: 'pointer',
                                padding: 2
                              }}
                            >
                              {copiedInviteLinkMap[member.id] ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                      )}

                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {canViewContact ? (
                            <>
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
                            </>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-subtle)', fontSize: 11.5 }}>
                              <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>Admin only</span>
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {member.status === 'pending' ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <button
                                type="button"
                                onClick={() => handleResendInvitation(member)}
                                disabled={resendStatusMap[member.email?.toLowerCase()]?.loading}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  background: '#16a34a',
                                  border: 'none',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  cursor: resendStatusMap[member.email?.toLowerCase()]?.loading ? 'wait' : 'pointer'
                                }}
                              >
                                <Mail size={12} />
                                <span>{resendStatusMap[member.email?.toLowerCase()]?.loading ? 'Sending...' : 'Resend Email'}</span>
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeInvite(member)}
                                  disabled={actionLoadingMemberId === member.id}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    color: '#f87171',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: actionLoadingMemberId === member.id ? 'wait' : 'pointer'
                                  }}
                                  title="Revoke invitation"
                                >
                                  <Trash2 size={12} />
                                  <span>Revoke</span>
                                </button>
                              )}
                            </div>
                          ) : isCurrent ? (
                            <button
                              type="button"
                              onClick={() => onNavigate && onNavigate('profile')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#ffffff',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              <User size={12} />
                              <span>Edit Profile</span>
                            </button>
                          ) : (
                            <>
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

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusModalMember(member);
                                    setIsStatusModalOpen(true);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: (member.status === 'blocked' || member.status === 'paused') ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                    border: (member.status === 'blocked' || member.status === 'paused') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                                    color: (member.status === 'blocked' || member.status === 'paused') ? '#4ade80' : '#f87171',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {(member.status === 'blocked' || member.status === 'paused') ? (
                                    <>
                                      <CheckCircle2 size={12} />
                                      <span>Reactivate</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShieldAlert size={12} />
                                      <span>Pause / Block</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignGroupTargetMember(member);
                                    setIsAssignGroupModalOpen(true);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    background: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                      ? 'rgba(245, 158, 11, 0.2)'
                                      : 'rgba(255, 255, 255, 0.06)',
                                    border: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                      ? '1px solid rgba(245, 158, 11, 0.45)'
                                      : '1px solid rgba(255, 255, 255, 0.1)',
                                    color: (!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev')))
                                      ? '#fbbf24'
                                      : '#d4d4d8',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                  title="Assign or change group (Marketing / Development)"
                                >
                                  <FolderPlus size={12} />
                                  <span>{(!member.department || (!member.department.toLowerCase().includes('market') && !member.department.toLowerCase().includes('dev'))) ? 'Assign Group' : 'Group'}</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
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
            maxWidth: 490,
            maxHeight: '92vh',
            overflowY: 'auto',
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
                color: role === 'intern' ? '#fbbf24' : '#ffffff',
                flexShrink: 0
              }}>
                {role === 'intern' ? <GraduationCap size={20} /> : <UserPlus size={18} />}
              </div>
              <div style={{ paddingRight: 36 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
                  {role === 'intern' ? 'Invite New Intern' : role === 'admin' ? 'Invite Administrator' : 'Invite Team Member'}
                </h3>
                <div style={{ fontSize: 12.5, color: '#71717a', marginTop: 3 }}>
                  Send an official access invitation to join the Ceova workspace
                </div>
              </div>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

              {/* Email Address */}
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

              {/* Clearance Role Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Clearance Role <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRole('member')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: role === 'member' ? '1px solid #ffffff' : '1px solid #27272a',
                      background: role === 'member' ? '#222226' : '#141416',
                      color: role === 'member' ? '#ffffff' : '#a1a1aa',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={16} style={{ color: role === 'member' ? '#ffffff' : '#71717a' }} />
                    <span>Member</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('intern')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: role === 'intern' ? '1px solid #fbbf24' : '1px solid #27272a',
                      background: role === 'intern' ? 'rgba(245, 158, 11, 0.15)' : '#141416',
                      color: role === 'intern' ? '#fbbf24' : '#a1a1aa',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <GraduationCap size={16} style={{ color: role === 'intern' ? '#fbbf24' : '#71717a' }} />
                    <span>Intern</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: 8,
                      border: role === 'admin' ? '1px solid #60a5fa' : '1px solid #27272a',
                      background: role === 'admin' ? 'rgba(96, 165, 250, 0.15)' : '#141416',
                      color: role === 'admin' ? '#60a5fa' : '#a1a1aa',
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Shield size={16} style={{ color: role === 'admin' ? '#60a5fa' : '#71717a' }} />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Mandatory Group Selection */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Select Group</span>
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ fontSize: 11, color: '#71717a', marginTop: 1 }}>
                      {role === 'intern' ? 'Required: Every intern must come under a group' : 'Required for workspace assignment'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 10px',
                      borderRadius: 6,
                      background: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
                    }}
                    title="Make a new group first"
                  >
                    <FolderPlus size={13} />
                    <span>+ Make New Group</span>
                  </button>
                </div>

                {role === 'intern' && (
                  <div style={{
                    marginBottom: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.22)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11.5,
                    color: '#fbbf24'
                  }}>
                    <Sparkles size={14} style={{ flexShrink: 0 }} />
                    <span>Every intern comes under a group. Select an existing group below or click &quot;+ Make New Group&quot; first.</span>
                  </div>
                )}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  maxHeight: 210,
                  overflowY: 'auto',
                  paddingRight: 2
                }}>
                  {allAvailableGroups.map((d) => {
                    const isSelected = (group || '').toLowerCase() === d.name.toLowerCase();
                    const groupColor = d.color || '#3b82f6';
                    return (
                      <div
                        key={d.id || d.name}
                        onClick={() => setGroup(d.name)}
                        style={{
                          padding: '12px',
                          borderRadius: 10,
                          border: isSelected ? `1px solid ${groupColor}` : '1px solid #27272a',
                          background: isSelected ? `${groupColor}18` : '#141416',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          position: 'relative',
                          boxShadow: isSelected ? `0 0 16px ${groupColor}25` : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: `${groupColor}25`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: groupColor
                          }}>
                            {d.name.toLowerCase().includes('market') ? (
                              <Megaphone size={14} />
                            ) : d.name.toLowerCase().includes('dev') ? (
                              <Code2 size={14} />
                            ) : (
                              <Users size={14} />
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
                        <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#ffffff' : '#e4e4e7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#a1a1aa', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.description || `${d.name} Team`}
                        </div>
                      </div>
                    );
                  })}

                  {/* Make New Group card tile */}
                  <div
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    style={{
                      padding: '12px',
                      borderRadius: 10,
                      border: '1px dashed #3f3f46',
                      background: 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      minHeight: 80,
                      color: '#a1a1aa'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#fbbf24';
                      e.currentTarget.style.color = '#fbbf24';
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#3f3f46';
                      e.currentTarget.style.color = '#a1a1aa';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    }}
                  >
                    <FolderPlus size={18} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>+ Make Group</span>
                    <span style={{ fontSize: 9.5, opacity: 0.7 }}>Create new first</span>
                  </div>
                </div>
              </div>

              {/* Assignment Summary Box */}
              <div style={{
                padding: '11px 14px',
                borderRadius: 8,
                background: '#161618',
                border: '1px solid #27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 12
              }}>
                <span style={{ color: '#a1a1aa' }}>Assigned Access:</span>
                <span style={{ fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{role === 'intern' ? 'INTERN' : role === 'admin' ? 'ADMIN' : 'MEMBER'}</span>
                  <span>•</span>
                  <span style={{ color: allAvailableGroups.find(d => d.name.toLowerCase() === (group || '').toLowerCase())?.color || '#60a5fa' }}>
                    {group || 'Select a Group'}
                  </span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 4, paddingTop: 16, borderTop: '1px solid #1f1f23' }}>
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
                    background: role === 'intern' ? '#f59e0b' : '#ffffff',
                    color: '#000000',
                    border: role === 'intern' ? '1px solid #f59e0b' : '1px solid #ffffff',
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
                    if (!loading) e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.opacity = '1';
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

      {/* Admin Member Access Control Modal */}
      <MemberStatusModal
        isOpen={isStatusModalOpen}
        member={statusModalMember}
        onClose={() => {
          setIsStatusModalOpen(false);
          setStatusModalMember(null);
        }}
      />

      {/* Admin Assign / Switch Group Pop-up Modal */}
      <AssignGroupModal
        isOpen={isAssignGroupModalOpen}
        member={assignGroupTargetMember}
        unassignedMembers={unassignedMembers}
        onClose={() => {
          setIsAssignGroupModalOpen(false);
          setAssignGroupTargetMember(null);
        }}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Admin Create / Make Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        initialRole={activePart === 'interns' ? 'intern' : 'member'}
        onSuccess={(createdGroup) => {
          setGroup(createdGroup.name);
          refreshData();
        }}
      />
    </div>
  );
};
