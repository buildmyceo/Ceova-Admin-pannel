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
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenConfig: () => void;
  onNavigateToProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenConfig,
  onNavigateToProfile,
}) => {
  const { user, role, logout, quickLoginAs, isSupabaseConfigured, updateCurrentProfile } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const statusOptions: Array<{ label: string; value: 'active' | 'away' | 'in_meeting' | 'offline' }> = [
    { label: 'Available', value: 'active' },
    { label: 'Away', value: 'away' },
    { label: 'In Meeting', value: 'in_meeting' },
    { label: 'Offline', value: 'offline' },
  ];

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <div className="brand-badge">
          <div className="brand-icon">C</div>
          <div className="brand-text">
            <h1>
              CEOVA
              <span className="brand-pill">Unified Portal</span>
            </h1>
          </div>
        </div>

        {/* Quick Role Switcher for seamless testing and demonstration */}
        <div className="role-quick-switch" title="Switch view between roles">
          <button
            type="button"
            className={`switch-btn admin ${role === 'admin' ? 'active' : ''}`}
            onClick={() => quickLoginAs('admin')}
          >
            <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
            Admin
          </button>
          <button
            type="button"
            className={`switch-btn head ${role === 'head' ? 'active' : ''}`}
            onClick={() => quickLoginAs('head')}
          >
            <Crown size={12} style={{ display: 'inline', marginRight: 4 }} />
            Head
          </button>
          <button
            type="button"
            className={`switch-btn member ${role === 'member' ? 'active' : ''}`}
            onClick={() => quickLoginAs('member')}
          >
            <User size={12} style={{ display: 'inline', marginRight: 4 }} />
            Member
          </button>
        </div>
      </div>

      <div className="nav-right">
        {/* Supabase connection indicator button */}
        <button
          type="button"
          className="supabase-status-pill"
          onClick={onOpenConfig}
          title="Supabase Database & Auth status - Click to configure"
        >
          <span className={`status-dot ${isSupabaseConfigured ? 'connected' : 'demo'}`} />
          <Database size={13} />
          <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Demo Mode (Click to setup Supabase)'}</span>
        </button>

        {user ? (
          <div style={{ position: 'relative' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
              }}
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
                    color: role === 'admin' ? 'var(--role-admin)' : role === 'head' ? 'var(--role-head)' : 'var(--role-member)' 
                  }}
                >
                  {role} • {user.department}
                </div>
              </div>

              <ChevronDown size={14} style={{ color: 'var(--text-subtle)' }} />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  width: 230,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: 8,
                  zIndex: 50,
                }}
              >
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
                  Supabase Setup
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
            Email Login / Register
          </button>
        )}
      </div>
    </header>
  );
};
