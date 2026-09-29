import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  Briefcase, 
  Bell, 
  CheckSquare, 
  MessageSquareQuote, 
  FileText, 
  UserCircle,
  Database
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'members' 
  | 'roles' 
  | 'department' 
  | 'announcements' 
  | 'tasks' 
  | 'requests' 
  | 'logs' 
  | 'profile';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenConfig: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenConfig }) => {
  const { user, role } = useAuth();

  const isAdmin = role === 'admin';
  const isHead = role === 'head';

  return (
    <aside className="sidebar">
      <div>
        {/* Core Navigation */}
        <div className="sidebar-category">Overview</div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'members' ? 'active' : ''}`}
            onClick={() => onSelectTab('members')}
          >
            <Users size={17} />
            <span>Members Directory</span>
          </button>
        </div>

        {/* Administration Section */}
        {isAdmin && (
          <>
            <div className="sidebar-category">Administration</div>
            <div className="sidebar-nav">
              <button
                type="button"
                className={`nav-item ${currentTab === 'roles' ? 'active' : ''}`}
                onClick={() => onSelectTab('roles')}
              >
                <ShieldCheck size={17} style={{ color: 'var(--role-admin)' }} />
                <span>Roles & Access</span>
                <span className="badge badge-role-admin">Admin</span>
              </button>
            </div>
          </>
        )}

        {/* Department / Leadership Section */}
        {(isAdmin || isHead) && (
          <>
            <div className="sidebar-category">Department Lead</div>
            <div className="sidebar-nav">
              <button
                type="button"
                className={`nav-item ${currentTab === 'department' ? 'active' : ''}`}
                onClick={() => onSelectTab('department')}
              >
                <Briefcase size={17} style={{ color: 'var(--role-head)' }} />
                <span>Department Hub</span>
                <span className="badge badge-role-head">{user?.department || 'Dept'}</span>
              </button>
            </div>
          </>
        )}

        {/* Collaboration & Workspace Section */}
        <div className="sidebar-category">Workspace</div>
        <div className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${currentTab === 'announcements' ? 'active' : ''}`}
            onClick={() => onSelectTab('announcements')}
          >
            <Bell size={17} />
            <span>Notice Board</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'tasks' ? 'active' : ''}`}
            onClick={() => onSelectTab('tasks')}
          >
            <CheckSquare size={17} />
            <span>Tasks & Milestones</span>
          </button>

          <button
            type="button"
            className={`nav-item ${currentTab === 'requests' ? 'active' : ''}`}
            onClick={() => onSelectTab('requests')}
          >
            <MessageSquareQuote size={17} />
            <span>Requests & Helpdesk</span>
          </button>

          {(isAdmin || isHead) && (
            <button
              type="button"
              className={`nav-item ${currentTab === 'logs' ? 'active' : ''}`}
              onClick={() => onSelectTab('logs')}
            >
              <FileText size={17} />
              <span>Audit Trail</span>
            </button>
          )}

          <button
            type="button"
            className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => onSelectTab('profile')}
          >
            <UserCircle size={17} />
            <span>My Profile</span>
          </button>
        </div>
      </div>

      {/* Footer Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          type="button"
          onClick={onOpenConfig}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: 'var(--text-muted)',
            fontSize: 12,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Database size={14} style={{ color: 'var(--accent-primary)' }} />
          <span>Supabase Configuration</span>
        </button>

        {user && (
          <div className="sidebar-user">
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
              <div 
                className="role-pill" 
                style={{ 
                  color: role === 'admin' ? 'var(--role-admin)' : role === 'head' ? 'var(--role-head)' : 'var(--role-member)' 
                }}
              >
                {role}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
