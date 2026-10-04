import React, { useState } from 'react';
import { usePortalData } from '../context/PortalDataContext';
import { 
  Bell, 
  CheckCheck, 
  X, 
  CheckSquare, 
  MessageSquare, 
  CreditCard, 
  Megaphone, 
  Info,
  Clock
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: any) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = usePortalData();
  const [activeCategory, setActiveCategory] = useState<'all' | 'task' | 'message' | 'approval' | 'announcement'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const getCategoryIcon = (cat: NotificationItem['category']) => {
    switch (cat) {
      case 'task': return <CheckSquare size={16} style={{ color: 'var(--accent-primary)' }} />;
      case 'message': return <MessageSquare size={16} style={{ color: '#06b6d4' }} />;
      case 'approval': return <CreditCard size={16} style={{ color: '#10b981' }} />;
      case 'announcement': return <Megaphone size={16} style={{ color: '#ec4899' }} />;
      default: return <Info size={16} style={{ color: '#f59e0b' }} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="notification-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Bell size={18} className="panel-icon blue" />
            <h3>Notification Center</h3>
            <span className="counter-pill">
              {notifications.filter(n => !n.read).length} Unread
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={markAllNotificationsAsRead}
              title="Mark all as read"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="notification-category-tabs">
          <button 
            className={`filter-chip ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'task' ? 'active' : ''}`}
            onClick={() => setActiveCategory('task')}
          >
            Tasks
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'message' ? 'active' : ''}`}
            onClick={() => setActiveCategory('message')}
          >
            Messages
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'approval' ? 'active' : ''}`}
            onClick={() => setActiveCategory('approval')}
          >
            Approvals
          </button>
          <button 
            className={`filter-chip ${activeCategory === 'announcement' ? 'active' : ''}`}
            onClick={() => setActiveCategory('announcement')}
          >
            Announcements
          </button>
        </div>

        {/* Notifications List */}
        <div className="notification-items-stack">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notification-item-card ${notif.read ? 'read' : 'unread'}`}
                onClick={() => markNotificationAsRead(notif.id)}
              >
                <div className="notif-icon-wrap">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="notif-body">
                  <div className="notif-title-row">
                    <span className="notif-title">{notif.title}</span>
                    <span className="notif-time">{notif.created_at}</span>
                  </div>
                  <div className="notif-msg-text">{notif.message}</div>
                </div>

                {!notif.read && <span className="unread-dot" />}
              </div>
            ))
          ) : (
            <div className="empty-state-card" style={{ padding: 40 }}>
              <Bell size={28} style={{ color: 'var(--text-subtle)', marginBottom: 8 }} />
              <h4>No notifications</h4>
              <p>You are all caught up in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
