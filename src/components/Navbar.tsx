import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Crown, 
  User, 
  Database, 
  LogOut, 
  LogIn, 
  Sparkles, 
  Settings,
  ChevronDown,
  Bell,
  Cpu,
  Palette,
  DollarSign,
  Briefcase,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../types';
import { usePortalData } from '../context/PortalDataContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenConfig: () => void;
  onOpenNotifications: () => void;
  onNavigateToProfile: () => void;
  onOpenWaitlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenConfig,
  onOpenNotifications,
  onNavigateToProfile,
  onOpenWaitlist,
}) => {
  const { user, role, logout, quickLoginAs, isSupabaseConfigured, updateCurrentProfile } = useAuth();
  const { waitlistRequests } = usePortalData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const pendingWaitlist = waitlistRequests.filter(w => w.status === 'pending');

  const statusOptions: Array<{ label: string; value: 'active' | 'away' | 'in_meeting' | 'offline' }> = [
    { label: 'Available', value: 'active' },
    { label: 'Away', value: 'away' },
    { label: 'In Meeting', value: 'in_meeting' },
    { label: 'Offline', value: 'offline' },
  ];

  const roleProfiles: Array<{ role: UserRole; title: string; name: string; icon: any }> = [
    { role: 'ceo', title: 'CEO', name: 'Harshit (CEO)', icon: Crown },
    { role: 'cto', title: 'CTO', name: 'Elena Rostova (CTO)', icon: Cpu },
    { role: 'cmo', title: 'CMO', name: 'Sophia Chen (CMO)', icon: Palette },
    { role: 'cfo', title: 'CFO', name: 'David Sterling (CFO)', icon: DollarSign },
    { role: 'coo', title: 'COO', name: 'Aarav Singhania (COO)', icon: Briefcase },
    { role: 'member', title: 'Core Dev', name: 'Rahul Sharma', icon: User },
    { role: 'intern', title: 'Intern', name: 'Aanya Patel', icon: GraduationCap }
  ];

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <div className="brand-badge" onClick={onNavigateToProfile} style={{ cursor: 'pointer' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 2,
            boxShadow: '0 0 12px rgba(212, 175, 55, 0.2)'
          }}>
            <img src="/ceovaimage.png" alt="Ceova Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="brand-text">
            <h1>
              CEOVA
              <span className="brand-pill">Team OS</span>
            </h1>
          </div>
        </div>

        {/* Quick Role Switcher for instant role preview & testing */}
        <div className="role-switch-dropdown-wrap">
          <button 
            type="button" 
            className="role-switcher-btn"
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            title="Switch user perspective to preview role-based dashboard & permissions"
          >
            <span className="role-switcher-label">View As:</span>
            <span className={`role-badge role-${role}`}>
              {role?.toUpperCase()}
            </span>
            <ChevronDown size={13} />
          </button>

          {showRoleMenu && (
            <div className="role-menu-dropdown">
              <div className="role-menu-header">Select Role Perspective</div>
              {roleProfiles.map((p) => {
                const IconComponent = p.icon;
                const isSelected = role === p.role;

                return (
                  <button
                    key={p.role}
                    type="button"
                    className={`role-option-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      quickLoginAs(p.role);
                      setShowRoleMenu(false);
                    }}
                  >
                    <IconComponent size={14} className="role-option-icon" />
                    <div className="role-option-text">
                      <span className="role-option-title">{p.title}</span>
                      <span className="role-option-name">{p.name}</span>
                    </div>
                    {isSelected && <span className="active-dot" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="nav-right">
        {/* CEO Waitlist Pending Alert Badge */}
        {role === 'ceo' && pendingWaitlist.length > 0 && (
          <button
            type="button"
            className="neu-pill-btn"
            style={{ 
              background: 'rgba(212, 175, 55, 0.15)', 
              border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '4px 10px',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onClick={onOpenWaitlist}
            title={`${pendingWaitlist.length} new access clearance requests waiting for CEO approval`}
          >
            <Crown size={13} style={{ color: 'var(--neo-gold)' }} />
            <span style={{ color: '#fff', fontWeight: 600 }}>{pendingWaitlist.length} Clearances</span>
          </button>
        )}

        {/* Access Clearance / Waitlist Button */}
        <button
          type="button"
          className="neu-pill-btn"
          style={{ fontSize: 11.5, padding: '5px 12px' }}
          onClick={onOpenWaitlist}
          title="Apply for access clearance or view waiting list queue"
        >
          <UserCheck size={13} style={{ color: 'var(--neo-gold)' }} />
          <span>Access Clearance</span>
        </button>

        {/* Notification Bell with Badge */}
        <button
          type="button"
          className="notification-nav-btn"
          onClick={onOpenNotifications}
          title="Notification Center"
        >
          <Bell size={16} />
          <span className="nav-badge-dot">3</span>
        </button>

        {/* Supabase status indicator */}
        <button
          type="button"
          className="supabase-status-pill"
          onClick={onOpenConfig}
          title="Supabase Database & Auth status - Click to configure"
        >
          <span className={`status-dot ${isSupabaseConfigured ? 'connected' : 'demo'}`} />
          <Database size={13} />
          <span>{isSupabaseConfigured ? 'Supabase Sync' : 'Local OS Mode'}</span>
        </button>

        {user ? (
          <div style={{ position: 'relative' }}>
            <div 
              className="navbar-user-chip"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="user-avatar-wrap" style={{ width: 32, height: 32 }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
                ) : (
                  <div className="avatar-fallback" style={{ fontSize: 12 }}>
                    {user.full_name.charAt(0)}
                  </div>
                )}
                <span className={`user-status-dot status-${user.status}`} style={{ width: 8, height: 8 }} />
              </div>

              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.full_name}
                </div>
                <div 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {role} • {user.department}
                </div>
              </div>

              <ChevronDown size={14} style={{ color: 'var(--text-subtle)' }} />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-menu-dropdown">
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateCurrentProfile({ status: opt.value });
                          setShowProfileMenu(false);
                        }}
                        style={{
                          fontSize: 11,
                          padding: '4px 6px',
                          border: user.status === opt.value ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                          background: user.status === opt.value ? 'rgba(99,102,241,0.15)' : 'transparent',
                          color: user.status === opt.value ? '#fff' : 'var(--text-muted)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="nav-item"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                  onClick={() => {
                    onNavigateToProfile();
                    setShowProfileMenu(false);
                  }}
                >
                  <User size={15} />
                  My Profile
                </button>

                <button
                  type="button"
                  className="nav-item"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                  onClick={() => {
                    onOpenConfig();
                    setShowProfileMenu(false);
                  }}
                >
                  <Settings size={15} />
                  Database & Auth
                </button>

                <button
                  type="button"
                  className="nav-item"
                  style={{ padding: '8px 10px', fontSize: 13, color: 'var(--danger)' }}
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            <LogIn size={14} />
            Email Login
          </button>
        )}
      </div>
    </header>
  );
};
