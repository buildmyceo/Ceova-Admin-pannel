import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Layers, 
  Calendar, 
  Users, 
  MessageSquare, 
  Bell, 
  FileText, 
  Building2, 
  BarChart3, 
  TrendingUp, 
  UserCircle, 
  Settings, 
  Lock, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'tasks' 
  | 'projects' 
  | 'calendar' 
  | 'team' 
  | 'chat' 
  | 'announcements' 
  | 'files' 
  | 'notifications' 
  | 'department' 
  | 'reports' 
  | 'performance' 
  | 'executive_room'
  | 'profile'
  | 'roles'
  | 'logs'
  | 'requests';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenConfig: () => void;
  onOpenNotifications: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  onSelectTab, 
  onOpenConfig,
  onOpenNotifications 
}) => {
  const { user, role, isCSuite, canViewFinancials } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        {/* Top Brand Identity Card with Ceova Logo */}
        <div style={{
          padding: '8px 12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: 14
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 2
          }}>
            <img src="/ceovaimage.png" alt="Ceova" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: '#fff' }}>
              CEOVA TECH
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--neo-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Team Operating System
            </div>
          </div>
        </div>

        {/* Core Navigation Group */}
        <div className="sidebar-category">Ceova OS</div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
            <span className={`badge-role-tag role-${role}`}>{role?.toUpperCase()}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
            onClick={() => onSelectTab('tasks')}
          >
            <CheckSquare size={17} />
            <span>My Tasks</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'projects' ? 'active' : ''}`}
            onClick={() => onSelectTab('projects')}
          >
            <Layers size={17} />
            <span>Projects</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'calendar' ? 'active' : ''}`}
            onClick={() => onSelectTab('calendar')}
          >
            <Calendar size={17} />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'team' ? 'active' : ''}`}
            onClick={() => onSelectTab('team')}
          >
            <Users size={17} />
            <span>Team & Hierarchy</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'chat' ? 'active' : ''}`}
            onClick={() => onSelectTab('chat')}
          >
            <MessageSquare size={17} />
            <span>Chat (WhatsApp)</span>
            <span className="sidebar-pulse-dot" />
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'announcements' ? 'active' : ''}`}
            onClick={() => onSelectTab('announcements')}
          >
            <Bell size={17} />
            <span>Announcements</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'files' ? 'active' : ''}`}
            onClick={() => onSelectTab('files')}
          >
            <FileText size={17} />
            <span>Files & SOPs</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onOpenNotifications}
          >
            <Bell size={17} />
            <span>Notifications</span>
            <span className="unread-counter">3</span>
          </button>
        </div>

        {/* Executive / Leadership Section */}
        {isCSuite && (
          <>
            <div className="sidebar-category">Executive Governance</div>
            <div className="sidebar-nav">
              <button
                type="button"
                className={`nav-item ${currentTab === 'executive_room' ? 'active' : ''}`}
                onClick={() => onSelectTab('executive_room')}
              >
                <Lock size={16} style={{ color: '#f59e0b' }} />
                <span>Executive Room</span>
                <span className="badge-gold">C-Suite</span>
              </button>
            </div>
          </>
        )}

        {/* Department & Analytics Section */}
        <div className="sidebar-category">Department & Intelligence</div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentTab === 'department' ? 'active' : ''}`}
            onClick={() => onSelectTab('department')}
          >
            <Building2 size={17} />
            <span>My Department</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
            onClick={() => onSelectTab('reports')}
          >
            <BarChart3 size={17} />
            <span>Reports {canViewFinancials && '& Finance'}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'performance' ? 'active' : ''}`}
            onClick={() => onSelectTab('performance')}
          >
            <TrendingUp size={17} />
            <span>Performance</span>
          </button>
        </div>
      </div>

      {/* Bottom Profile & Settings Section */}
      <div className="sidebar-footer">
        <div className="sidebar-nav" style={{ marginBottom: 8 }}>
          <button
            type="button"
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => onSelectTab('profile')}
          >
            <UserCircle size={17} />
            <span>Profile</span>
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={onOpenConfig}
          >
            <Settings size={17} />
            <span>Settings & Database</span>
          </button>
        </div>

        {/* Active User Card */}
        {user && (
          <div className="sidebar-user-card" onClick={() => onSelectTab('profile')}>
            <div className="user-avatar-wrap">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
              ) : (
                <div className="avatar-fallback">{user.full_name.charAt(0)}</div>
              )}
              <span className={`user-status-dot status-${user.status}`} />
            </div>
            <div className="user-meta">
              <div className="name">{user.full_name}</div>
              <div className="user-sub-label">
                {user.role.toUpperCase()} • {user.department}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
