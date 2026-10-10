import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserCircle,
  Users,
  CheckSquare,
  BookmarkCheck,
  Calendar,
  Bell,
  X
} from 'lucide-react';

export type NavTab = 'dashboard' | 'profile' | 'members' | 'tasks' | 'calendar' | 'notifications' | 'app_dashboard' | 'saved';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenConfig?: () => void;
  isMobileView?: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab,
  isMobileView = false,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { user } = useAuth();

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`sidebar ${isOpenMobile ? 'mobile-open' : ''} ${!isMobileView && !isOpenMobile ? 'desktop-collapsed' : ''}`}>
      <div>
        {/* Mobile Drawer Header with branding & close button */}
        <div className="sidebar-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#161618',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 5
            }}>
              <img src="/ceovaimage.png" alt="Ceova Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'invert(1)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>CEOVA</span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Management OS</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-category">Ceova OS</div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'members' ? 'active' : ''}`}
            onClick={() => handleNavClick('members')}
          >
            <Users size={17} />
            <span>Members</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
            onClick={() => handleNavClick('tasks')}
          >
            <CheckSquare size={17} />
            <span>Tasks</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'calendar' ? 'active' : ''}`}
            onClick={() => handleNavClick('calendar')}
          >
            <Calendar size={17} />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleNavClick('notifications')}
          >
            <Bell size={17} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'saved' ? 'active' : ''}`}
            onClick={() => handleNavClick('saved')}
          >
            <BookmarkCheck size={17} />
            <span>Saved Vault</span>
          </button>
        </div>
      </div>

      {/* Bottom Profile & Active User Section */}
      <div className="sidebar-footer">
        {user && (
          <div 
            className="sidebar-user-card" 
            onClick={() => handleNavClick('profile')} 
            title="Click to view and edit profile photo & details"
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar-wrap">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
              ) : (
                <div className="avatar-fallback">{user.full_name.charAt(0)}</div>
              )}
            </div>
            <div className="user-meta">
              <div className="name">{user.full_name}</div>
              <div className="user-sub-label">
                {user.role === 'ceo' ? 'CEO' : user.role === 'admin' ? 'ADMIN' : user.role === 'intern' ? 'INTERN' : 'MEMBER'} • {user.role === 'intern' && (!user.department || user.department === 'General') ? 'Internship' : (user.department || (user.role === 'ceo' ? 'Executive' : user.role === 'admin' ? 'Administration' : 'General'))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
