import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  LogOut, 
  LogIn, 
  ChevronDown,
  Menu,
  Check,
  X,
  Bell
} from 'lucide-react';
import { getStoredNotifications } from '../lib/notificationsService';

interface NavbarProps {
  onOpenAuth: () => void;
  onNavigateToProfile: () => void;
  onNavigateToNotifications?: () => void;
  onOpenConfig?: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onNavigateToProfile,
  onNavigateToNotifications,
  onToggleSidebar,
}) => {
  const { 
    user, 
    savedAccounts, 
    switchAccount, 
    removeAccount, 
    logout, 
    logoutAll, 
    updateCurrentProfile 
  } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(0);

  useEffect(() => {
    const updateUnread = () => {
      try {
        const notifs = getStoredNotifications();
        const unread = notifs.filter(n => !n.read).length;
        setUnreadNotifCount(unread);
      } catch (err) {
        console.error(err);
      }
    };

    updateUnread();
    window.addEventListener('ceova_notifications_updated', updateUnread);
    return () => {
      window.removeEventListener('ceova_notifications_updated', updateUnread);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);



  return (
    <>
      <header className="top-navbar">
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleSidebar && (
          <button 
            type="button" 
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              padding: 0
            }}
          >
            <Menu size={20} />
          </button>
        )}
        
        <div className="brand-badge" onClick={onNavigateToProfile} style={{ cursor: 'pointer' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#161618',
            border: '1px solid #27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <img src="/ceovaimage.png" alt="Ceova Logo" style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              filter: 'invert(1)',
              mixBlendMode: 'screen',
              opacity: 0.95
            }} />
          </div>
          <div className="brand-text">
            <h1>
              CEOVA
            </h1>
          </div>
        </div>
      </div>

      <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user && onNavigateToNotifications && (
          <button
            type="button"
            title="Notifications & Alerts"
            onClick={onNavigateToNotifications}
            style={{
              position: 'relative',
              background: '#161618',
              border: '1px solid #27272a',
              borderRadius: 10,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-main, #ffffff)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Bell size={17} />
            {unreadNotifCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 700,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
              }}>
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>
        )}

        {user ? (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
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
              </div>

              <div className="navbar-user-info" style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div className="navbar-user-name" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                  {user.full_name}
                </div>
                <div 
                  className="navbar-user-sub"
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)'
                  }}
                >
                  {(user.role === 'ceo') ? 'CEO' : (user.role === 'admin') ? 'ADMIN' : user.role === 'intern' ? 'INTERN' : 'MEMBER'} • {user.department || (user.role === 'ceo' ? 'Executive' : user.role === 'admin' ? 'Administration' : 'General')}
                </div>
              </div>

              <ChevronDown size={14} style={{ color: 'var(--text-subtle)' }} />
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-menu-dropdown">
                {/* 1. Multiple Accounts Section (only shown when multiple accounts exist) */}
                {savedAccounts.length > 1 && (
                  <div style={{ padding: '8px 6px 4px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '2px 6px 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    <span>Accounts</span>
                    <span style={{ 
                      fontSize: 10, 
                      background: 'rgba(255, 255, 255, 0.08)', 
                      padding: '1px 6px', 
                      borderRadius: 10 
                    }}>
                      {savedAccounts.length}
                    </span>
                  </div>

                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {savedAccounts.map((acc) => {
                      const isActive = acc.profile.id === user.id;
                      return (
                        <div
                          key={acc.profile.id || acc.profile.email}
                          onClick={() => {
                            if (!isActive) {
                              switchAccount(acc.profile.id);
                              setShowProfileMenu(false);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: isActive ? '#1c1c1f' : 'transparent',
                            border: isActive ? '1px solid #333338' : '1px solid transparent',
                            cursor: isActive ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          className={!isActive ? 'nav-item-account-hover' : ''}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: 26,
                              height: 26,
                              borderRadius: '50%',
                              background: (acc.profile.role === 'admin' || acc.profile.role === 'ceo') ? 'var(--accent-primary, #3b82f6)' : acc.profile.role === 'intern' ? '#f59e0b' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 600,
                              overflow: 'hidden',
                              flexShrink: 0
                            }}>
                              {acc.profile.avatar_url ? (
                                <img src={acc.profile.avatar_url} alt={acc.profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                (acc.profile.full_name || 'U').charAt(0).toUpperCase()
                              )}
                            </div>

                            <div style={{ minWidth: 0, flex: 1, textAlign: 'left', lineHeight: 1.2 }}>
                              <div style={{ 
                                fontSize: 12, 
                                fontWeight: 600, 
                                color: 'var(--text-main)', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }} >
                                {acc.profile.full_name}
                              </div>
                              <div style={{ 
                                fontSize: 10, 
                                color: 'var(--text-muted)', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                <span style={{ 
                                  color: (acc.profile.role === 'admin' || acc.profile.role === 'ceo') ? 'var(--accent-primary)' : acc.profile.role === 'intern' ? '#f59e0b' : 'var(--text-muted)',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  fontSize: 9
                                }}>
                                  {acc.profile.role === 'ceo' ? 'CEO' : acc.profile.role === 'admin' ? 'Admin' : acc.profile.role === 'intern' ? 'Intern' : 'Member'}
                                </span>
                                {' • '}
                                {acc.profile.email}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 6 }}>
                            {isActive ? (
                              <span style={{ 
                                color: '#10b981', 
                                fontSize: 10, 
                                fontWeight: 600, 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2,
                                background: 'rgba(16, 185, 129, 0.12)',
                                padding: '2px 5px',
                                borderRadius: 4
                              }}>
                                <Check size={11} />
                              </span>
                            ) : (
                              <button
                                type="button"
                                title="Remove account from device"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeAccount(acc.profile.id);
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: 3,
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  opacity: 0.6,
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

                {/* 2. Navigation & Actions */}
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
                  style={{ padding: '8px 10px', fontSize: 13, color: 'var(--danger)' }}
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>

                {savedAccounts.length > 1 && (
                  <button
                    type="button"
                    className="nav-item"
                    style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-muted)' }}
                    onClick={() => {
                      logoutAll();
                      setShowProfileMenu(false);
                    }}
                  >
                    <LogOut size={13} />
                    Sign out of all accounts
                  </button>
                )}
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
    </>
  );
};
