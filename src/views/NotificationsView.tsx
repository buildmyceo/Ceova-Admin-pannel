import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppNotification, NotificationType, NotificationAttachment, Profile } from '../types';
import { NavTab } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import {
  getStoredNotifications,
  fetchNotificationsFromSupabase,
  subscribeToNotificationsRealtime,
  markNotificationRead,
  markAllNotificationsRead,
  markMultipleNotificationsRead,
  isNotificationReadByUser,
  getNotificationReadReceipt,
  deleteNotification,
  clearAllNotifications,
  sendMemberNotification
} from '../lib/notificationsService';
import { sanitizeUrl, isSafeHttpUrl, validateAttachmentFile } from '../lib/security';
import {
  Bell,
  Send,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  X,
  Check,
  CheckCheck,
  Trash2,
  Video,
  CheckSquare,
  Sparkles,
  Clock,
  Filter,
  Users,
  UserCheck,
  MessageSquare,
  ExternalLink,
  Download,
  Search,
  AlertCircle,
  Eye,
  CornerDownRight
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate?: (tab: NavTab) => void;
}

type FilterTab = 'all' | 'unread' | 'message' | 'meeting' | 'task' | 'system';
type ViewCategory = 'inbox' | 'sent';

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { user, role } = useAuth();
  const { members } = usePortalData();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [activeCategory, setActiveCategory] = useState<ViewCategory>('inbox');

  // Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'members'>('members');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [photosList, setPhotosList] = useState<NotificationAttachment[]>([]);
  const [filesList, setFilesList] = useState<NotificationAttachment[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Photo Lightbox modal
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<string | null>(null);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = role === 'admin' || role === 'ceo';

  const reloadNotifications = () => {
    setNotifications(getStoredNotifications(user));
  };

  useEffect(() => {
    reloadNotifications();

    // Initial fetch from Supabase
    fetchNotificationsFromSupabase(user)
      .then((fresh) => setNotifications(fresh))
      .catch(console.error);

    // Subscribe to realtime channel for instant cross-device updates
    const unsubscribeRealtime = subscribeToNotificationsRealtime(undefined, user);

    const handleUpdate = () => {
      reloadNotifications();
    };

    const handleOpenCompose = (e: any) => {
      setIsComposeOpen(true);
      if (e.detail?.memberId) {
        setSelectedRecipientIds([e.detail.memberId]);
        setTargetType('members');
      }
    };

    window.addEventListener('ceova_notifications_updated', handleUpdate);
    window.addEventListener('ceova_open_compose_notification', handleOpenCompose);

    // Check if opened with pre-selected member in sessionStorage
    const preselectedMember = sessionStorage.getItem('ceova_compose_target_member');
    if (preselectedMember) {
      setSelectedRecipientIds([preselectedMember]);
      setTargetType('members');
      setIsComposeOpen(true);
      sessionStorage.removeItem('ceova_compose_target_member');
    }

    return () => {
      window.removeEventListener('ceova_notifications_updated', handleUpdate);
      window.removeEventListener('ceova_open_compose_notification', handleOpenCompose);
      unsubscribeRealtime();
    };
  }, [user]);

  // When compose modal opens, default target type appropriately
  const handleOpenComposeModal = (initialRecipientId?: string) => {
    setFormError('');
    setSubject('');
    setMessageText('');
    setLinkInput('');
    setPhotosList([]);
    setFilesList([]);
    setMemberSearch('');

    if (initialRecipientId) {
      setSelectedRecipientIds([initialRecipientId]);
      setTargetType('members');
    } else {
      if (isAdmin) {
        setTargetType('all');
        setSelectedRecipientIds([]);
      } else {
        setTargetType('members');
        setSelectedRecipientIds([]);
      }
    }

    setIsComposeOpen(true);
  };

  // Filter list of members available for selection (exclude self, and exclude paused/blocked members)
  const selectableMembers = useMemo(() => {
    return members.filter(m => (!user || m.id !== user.id) && m.status !== 'blocked' && m.status !== 'paused');
  }, [members, user]);

  const filteredSelectableMembers = useMemo(() => {
    if (!memberSearch.trim()) return selectableMembers;
    const q = memberSearch.toLowerCase().trim();
    return selectableMembers.filter(m =>
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q) ||
      (m.designation || '').toLowerCase().includes(q)
    );
  }, [selectableMembers, memberSearch]);

  const toggleRecipient = (memberId: string) => {
    setSelectedRecipientIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  // Photo file upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const validation = validateAttachmentFile(file, 'photo');
      if (!validation.valid) {
        setFormError(validation.error || 'Only standard photo files up to 5 MB are allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          const newPhoto: NotificationAttachment = {
            id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            url: result,
            type: 'photo',
            size: file.size
          };
          setPhotosList(prev => [...prev, newPhoto]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Document/file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const validation = validateAttachmentFile(file, 'document');
      if (!validation.valid) {
        setFormError(validation.error || 'Invalid attachment file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          const newFile: NotificationAttachment = {
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            url: result,
            type: 'file',
            size: file.size
          };
          setFilesList(prev => [...prev, newFile]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (photoId: string) => {
    setPhotosList(prev => prev.filter(p => p.id !== photoId));
  };

  const removeFile = (fileId: string) => {
    setFilesList(prev => prev.filter(f => f.id !== fileId));
  };

  // Submit send notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be logged in to send a notification.');
      return;
    }

    if (!subject.trim()) {
      setFormError('Please enter a notification subject or title.');
      return;
    }

    if (!messageText.trim()) {
      setFormError('Please enter the message body.');
      return;
    }

    // Role check: non-admin can only send to specific members
    const finalTargetType = isAdmin ? targetType : 'members';

    if (finalTargetType === 'members' && selectedRecipientIds.length === 0) {
      setFormError('Please select at least one team member to notify.');
      return;
    }

    const cleanLink = linkInput.trim();
    if (cleanLink && !isSafeHttpUrl(cleanLink)) {
      setFormError('Please enter a valid HTTP/HTTPS link (e.g. https://example.com).');
      return;
    }

    // Gather recipient names and emails
    const selectedMembers = selectableMembers.filter(m => selectedRecipientIds.includes(m.id));
    const recipientNames = selectedMembers.map(m => m.full_name);
    const recipientEmails = selectedMembers.map(m => m.email).filter(Boolean);

    setIsSending(true);
    try {
      await sendMemberNotification({
        sender: user,
        target_type: finalTargetType,
        recipient_ids: selectedRecipientIds,
        recipient_names: recipientNames,
        recipient_emails: recipientEmails,
        title: subject,
        message: messageText,
        link: cleanLink ? sanitizeUrl(cleanLink) : undefined,
        photos: photosList,
        files: filesList
      });

      setIsComposeOpen(false);
      reloadNotifications();
    } catch (err: any) {
      setFormError(err.message || 'Failed to send notification.');
    } finally {
      setIsSending(false);
    }
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !isNotificationReadByUser(n, user) && n.sender_id !== user?.id).length;
  }, [notifications, user]);

  // Notifications partitioned by Inbox vs Sent
  const categorizedNotifications = useMemo(() => {
    if (!user) return notifications;
    if (activeCategory === 'sent') {
      return notifications.filter(n => n.sender_id === user.id);
    }
    // Inbox: messages addressed to user or broadcast, or non-message notifications
    return notifications.filter(n => {
      if (n.sender_id === user.id) return false;
      return true;
    });
  }, [notifications, activeCategory, user]);

  const filteredNotifications = useMemo(() => {
    return categorizedNotifications.filter(n => {
      if (activeFilter === 'unread') return !isNotificationReadByUser(n, user) && n.sender_id !== user?.id;
      if (activeFilter === 'message') return n.type === 'message';
      if (activeFilter === 'meeting') return n.type === 'meeting';
      if (activeFilter === 'task') return n.type === 'task' || n.type === 'deliverable';
      if (activeFilter === 'system') return n.type === 'system';
      return true;
    });
  }, [categorizedNotifications, activeFilter, user]);

  // Auto-read: when viewing Inbox, mark visible unread notifications as read after glancing
  useEffect(() => {
    if (!user || activeCategory !== 'inbox') return;

    const unreadNotifications = notifications.filter(
      n => n.sender_id !== user.id && !isNotificationReadByUser(n, user)
    );

    if (unreadNotifications.length === 0) return;

    const unreadIds = unreadNotifications.map(n => n.id);
    const timer = setTimeout(() => {
      markMultipleNotificationsRead(unreadIds, user);
      reloadNotifications();
    }, 1200);

    return () => clearTimeout(timer);
  }, [notifications, activeCategory, user]);

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user);
    reloadNotifications();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications in this view?')) {
      clearAllNotifications();
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getTypeMeta = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return {
          icon: <MessageSquare size={16} />,
          label: 'Direct Notification',
          color: '#38bdf8',
          bg: 'rgba(56, 189, 248, 0.12)',
          border: 'rgba(56, 189, 248, 0.3)'
        };
      case 'meeting':
        return {
          icon: <Video size={16} />,
          label: 'Google Meet',
          color: '#34d399',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)'
        };
      case 'task':
      case 'deliverable':
        return {
          icon: <CheckSquare size={16} />,
          label: 'Task & Deliverable',
          color: '#60a5fa',
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.3)'
        };
      case 'system':
      default:
        return {
          icon: <Sparkles size={16} />,
          label: 'System Notice',
          color: '#a78bfa',
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.3)'
        };
    }
  };

  return (
    <div className="view-container ceova-notifications-container fade-in">
      {/* Top Header */}
      <div className="ceova-notif-header">
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
              flexShrink: 0
            }}>
              <Bell size={20} />
            </div>
            <h1 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 700, margin: 0, color: 'var(--text-main, #ffffff)', letterSpacing: '-0.02em' }}>
              Notifications &amp; Team Messaging
            </h1>
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.45)',
                flexShrink: 0
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-muted, #a1a1aa)', lineHeight: 1.5 }}>
            Send messages, broadcast company alerts, and exchange photos, files, and links with team members.
          </p>
        </div>

        {/* Action Controls */}
        <div className="ceova-notif-header-actions">
          <button
            type="button"
            className="ceova-notif-btn-primary"
            onClick={() => handleOpenComposeModal()}
          >
            <Send size={15} />
            <span>Send Notification</span>
          </button>

          {(unreadCount > 0 || notifications.length > 0) && (
            <div className="ceova-notif-btn-subgroup">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(22, 22, 26, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-main)',
                    padding: '8px 14px',
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckCheck size={14} />
                  <span>Mark all read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(22, 22, 26, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    padding: '8px 14px',
                    borderRadius: 9,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary Category Switcher: Inbox vs Sent */}
      <div className="ceova-notif-switcher-wrap">
        <div className="ceova-notif-category-switcher" style={{
          display: 'flex',
          background: 'rgba(16, 20, 32, 0.65)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 3,
          gap: 4,
          width: '100%',
          maxWidth: 420,
          boxSizing: 'border-box'
        }}>
          <button
            type="button"
            className="ceova-notif-category-btn"
            onClick={() => setActiveCategory('inbox')}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '7px 12px',
              borderRadius: 9,
              border: 'none',
              background: activeCategory === 'inbox' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: activeCategory === 'inbox' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={14} style={{ flexShrink: 0 }} />
            <span className="ceova-notif-tab-full">Inbox &amp; Received</span>
            <span className="ceova-notif-tab-short">Inbox</span>
            <span style={{
              background: activeCategory === 'inbox' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
              fontSize: 10.5,
              padding: '1px 6px',
              borderRadius: 8,
              color: activeCategory === 'inbox' ? '#ffffff' : 'inherit',
              flexShrink: 0
            }}>
              {notifications.filter(n => n.sender_id !== user?.id).length}
            </span>
          </button>

          <button
            type="button"
            className="ceova-notif-category-btn"
            onClick={() => setActiveCategory('sent')}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '7px 12px',
              borderRadius: 9,
              border: 'none',
              background: activeCategory === 'sent' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: activeCategory === 'sent' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Send size={14} style={{ flexShrink: 0 }} />
            <span className="ceova-notif-tab-full">Sent Messages</span>
            <span className="ceova-notif-tab-short">Sent</span>
            <span style={{
              background: activeCategory === 'sent' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
              fontSize: 10.5,
              padding: '1px 6px',
              borderRadius: 8,
              color: activeCategory === 'sent' ? '#ffffff' : 'inherit',
              flexShrink: 0
            }}>
              {notifications.filter(n => n.sender_id === user?.id).length}
            </span>
          </button>
        </div>

        {/* Quick hint badge */}
        <div className="ceova-notif-mode-badge" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 11.5,
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '6px 10px',
          borderRadius: 8
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: isAdmin ? '#10b981' : '#3b82f6',
            boxShadow: isAdmin ? '0 0 6px #10b981' : '0 0 6px #3b82f6',
            flexShrink: 0
          }} />
          <span>
            {isAdmin 
              ? 'Administrator Mode: Can broadcast to all or target specific members'
              : 'Team Mode: Can send direct notifications to selected members'}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="ceova-filter-scroll-row ceova-hide-scrollbar" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        overflowX: 'auto',
        maxWidth: '100%',
        paddingBottom: 6,
        paddingLeft: 1,
        paddingRight: 1
      }}>
        {[
          { id: 'all', label: 'All Alerts', count: categorizedNotifications.length },
          { id: 'unread', label: 'Unread', count: categorizedNotifications.filter(n => !isNotificationReadByUser(n, user) && n.sender_id !== user?.id).length },
          { id: 'message', label: 'Direct Messages', count: categorizedNotifications.filter(n => n.type === 'message').length },
          { id: 'meeting', label: 'Google Meets', count: categorizedNotifications.filter(n => n.type === 'meeting').length },
          { id: 'task', label: 'Tasks & Deliverables', count: categorizedNotifications.filter(n => n.type === 'task' || n.type === 'deliverable').length },
          { id: 'system', label: 'System', count: categorizedNotifications.filter(n => n.type === 'system').length }
        ].map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id as FilterTab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 13px',
                borderRadius: 8,
                background: isActive ? 'rgba(37, 99, 235, 0.3)' : 'rgba(18, 18, 22, 0.6)',
                backdropFilter: 'blur(20px)',
                border: isActive ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: isActive ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notification List Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {filteredNotifications.length === 0 ? (
          <div style={{
            background: 'rgba(12, 16, 26, 0.52)',
            backdropFilter: 'blur(45px) saturate(170%)',
            WebkitBackdropFilter: 'blur(45px) saturate(170%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: 'clamp(32px, 6vw, 48px) 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            boxShadow: '0 16px 36px -12px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#60a5fa',
              boxShadow: '0 8px 20px -4px rgba(59, 130, 246, 0.25)'
            }}>
              <Bell size={24} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: 'var(--text-main, #ffffff)' }}>
              No notifications found
            </h3>
            <p style={{ margin: '0 auto 18px', fontSize: 12.5, maxWidth: 380, lineHeight: 1.5 }}>
              {activeFilter === 'unread' 
                ? "You're all caught up! No unread notifications." 
                : activeCategory === 'sent'
                ? "You haven't sent any notifications yet. Click 'Send Notification' to get started."
                : 'No alerts match the selected filter category.'}
            </p>
            <button
              type="button"
              onClick={() => handleOpenComposeModal()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: '1px solid #3b82f6',
                padding: '9px 18px',
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
              }}
            >
              <Send size={13} />
              <span>Send a Notification</span>
            </button>
          </div>
        ) : (
          filteredNotifications.map(item => {
            const meta = getTypeMeta(item.type);
            const isSentByMe = item.sender_id === user?.id;
            const isRead = isNotificationReadByUser(item, user);
            const receipt = isSentByMe ? getNotificationReadReceipt(item, members) : null;

            return (
              <div
                key={item.id}
                className="ceova-notif-card-container"
                onClick={() => {
                  if (!isRead && !isSentByMe) {
                    markNotificationRead(item.id, user);
                    reloadNotifications();
                  }
                }}
                onMouseEnter={() => {
                  if (!isRead && !isSentByMe) {
                    markNotificationRead(item.id, user);
                    reloadNotifications();
                  }
                }}
                style={{
                  background: (isRead || isSentByMe) ? 'rgba(12, 16, 26, 0.52)' : 'rgba(16, 22, 38, 0.72)',
                  backdropFilter: 'blur(45px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(45px) saturate(170%)',
                  border: (isRead || isSentByMe)
                    ? '1px solid rgba(255, 255, 255, 0.08)' 
                    : '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: 16,
                  padding: 'clamp(13px, 3.5vw, 20px)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'all 0.15s ease',
                  boxShadow: (isRead || isSentByMe)
                    ? '0 12px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.06)' 
                    : '0 16px 36px -10px rgba(0,0,0,0.75), inset 0 1px 0 rgba(59, 130, 246, 0.25)',
                  position: 'relative',
                  cursor: (!isRead && !isSentByMe) ? 'pointer' : 'default'
                }}
              >
                {/* Unread Indicator Bar */}
                {!isRead && !isSentByMe && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 14,
                    bottom: 14,
                    width: 3.5,
                    background: '#3b82f6',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: '0 0 8px #3b82f6'
                  }} />
                )}

                {/* Left Content */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0, width: '100%' }}>
                  {/* Sender Avatar or Icon */}
                  {item.sender_avatar ? (
                    <img
                      src={item.sender_avatar}
                      alt={item.sender_name || 'Sender'}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        flexShrink: 0
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: meta.bg,
                      border: `1px solid ${meta.border}`,
                      color: meta.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {meta.icon}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Header Badges */}
                    <div className="ceova-notif-card-header">
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: meta.color,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                        padding: '1px 6px',
                        borderRadius: 4,
                        flexShrink: 0
                      }}>
                        {meta.label}
                      </span>

                      {/* Sender Details */}
                      {item.sender_name && (
                        <span style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          flexShrink: 0
                        }}>
                          <span>{item.sender_name}</span>
                          {item.sender_role && (
                            <span style={{
                              fontSize: 10,
                              textTransform: 'capitalize',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: item.sender_role === 'admin' ? 'rgba(239, 68, 68, 0.18)' : item.sender_role === 'intern' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(59, 130, 246, 0.18)',
                              color: item.sender_role === 'admin' ? '#f87171' : item.sender_role === 'intern' ? '#fbbf24' : '#60a5fa',
                              border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                              {item.sender_role}
                            </span>
                          )}
                        </span>
                      )}

                      {/* Audience Badge */}
                      <span style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '1px 7px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0
                      }}>
                        {item.target_type === 'all' ? (
                          <>
                            <Users size={11} />
                            <span>To: Everyone</span>
                          </>
                        ) : (
                          <>
                            <UserCheck size={11} />
                            <span>
                              To: {item.recipient_names && item.recipient_names.length > 0
                                ? (item.recipient_names.length === 1 
                                    ? item.recipient_names[0] 
                                    : `${item.recipient_names[0]} +${item.recipient_names.length - 1}`)
                                : 'Specific Members'}
                            </span>
                          </>
                        )}
                      </span>

                      {/* Read Receipt Badge on Header for Senders */}
                      {isSentByMe && receipt && (
                        <span
                          title={receipt.seenNames.length > 0 ? `Seen by: ${receipt.seenNames.join(', ')}` : (receipt.seenCount > 0 ? 'Seen by recipient' : 'Delivered to recipients')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '1px 7px',
                            borderRadius: 5,
                            background: receipt.seenCount > 0 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.06)',
                            border: receipt.seenCount > 0 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: receipt.seenCount > 0 ? '#34d399' : '#a1a1aa',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0
                          }}
                        >
                          {receipt.seenCount > 0 ? (
                            <CheckCheck size={12} style={{ color: '#10b981' }} />
                          ) : (
                            <Check size={11} style={{ color: '#71717a' }} />
                          )}
                          <span>
                            {receipt.isBroadcast || receipt.totalRecipients > 1
                              ? (receipt.seenCount > 0 ? `Seen by ${receipt.seenCount}/${receipt.totalRecipients}` : 'Delivered (0 seen)')
                              : (receipt.seenCount > 0 ? 'Seen' : 'Delivered')}
                          </span>
                        </span>
                      )}

                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
                        <Clock size={11} />
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 style={{
                      margin: '0 0 6px 0',
                      fontSize: 15,
                      fontWeight: 700,
                      color: item.read ? 'var(--text-main, #ffffff)' : '#ffffff'
                    }}>
                      {item.title}
                    </h4>

                    {/* Message Body */}
                    <p style={{
                      margin: 0,
                      fontSize: 13,
                      color: 'var(--text-muted, #a1a1aa)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {item.message}
                    </p>

                    {/* Attachments Section: ONLY Link, Photos, and Files */}
                    {/* 1. LINK ATTACHMENT */}
                    {item.link && (
                      <div style={{ marginTop: 12 }}>
                        <a
                          href={sanitizeUrl(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markNotificationRead(item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            maxWidth: '100%',
                            background: 'rgba(37, 99, 235, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.35)',
                            color: '#60a5fa',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <LinkIcon size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.link}</span>
                          <ExternalLink size={12} style={{ flexShrink: 0 }} />
                        </a>
                      </div>
                    )}

                    {/* 2. PHOTOS ATTACHMENT GALLERY */}
                    {item.photos && item.photos.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <ImageIcon size={12} />
                          <span>Attached Photos ({item.photos.length})</span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(95px, 1fr))',
                          gap: 8
                        }}>
                          {item.photos.map((photo) => (
                            <div
                              key={photo.id}
                              onClick={() => setActiveLightboxPhoto(photo.url)}
                                style={{
                                position: 'relative',
                                borderRadius: 8,
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                background: '#121215',
                                cursor: 'pointer',
                                aspectRatio: '16/10'
                              }}
                              title="Click to view enlarged"
                            >
                              <img
                                src={sanitizeUrl(photo.url)}
                                alt={photo.name}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.2s ease'
                                }}
                              />
                              <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                                padding: '4px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: 10,
                                color: '#ffffff'
                              }}>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {photo.name}
                                </span>
                                <Eye size={10} style={{ opacity: 0.7 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. FILES ATTACHMENT LIST */}
                    {item.files && item.files.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5
                        }}>
                          <FileText size={12} />
                          <span>Attached Documents & Files ({item.files.length})</span>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8
                        }}>
                          {item.files.map((file) => (
                            <a
                              key={file.id}
                              href={sanitizeUrl(file.url)}
                              download={file.name}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                maxWidth: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                color: 'var(--text-main)',
                                fontSize: 12,
                                textDecoration: 'none',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <FileText size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                              {file.size && (
                                <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                                  ({formatFileSize(file.size)})
                                </span>
                              )}
                              <Download size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meeting or Task specific actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      {item.type === 'meeting' && item.link && (
                        <a
                          href={sanitizeUrl(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markNotificationRead(item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'linear-gradient(135deg, #059669, #047857)',
                            color: '#ffffff',
                            padding: '6px 14px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                          }}
                        >
                          <Video size={13} />
                          Join Google Meet
                          <ExternalLink size={11} />
                        </a>
                      )}

                      {item.type === 'meeting' && onNavigate && (
                        <button
                          type="button"
                          onClick={() => {
                            markNotificationRead(item.id);
                            onNavigate('calendar');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#60a5fa',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Open Calendar
                        </button>
                      )}

                      {(item.type === 'task' || item.type === 'deliverable') && onNavigate && (
                        <button
                          type="button"
                          onClick={() => {
                            markNotificationRead(item.id);
                            onNavigate('tasks');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#60a5fa',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <CheckSquare size={13} />
                          View Tasks Board
                        </button>
                      )}

                      {/* Reply Button if sender is someone else */}
                      {item.sender_id && item.sender_id !== user?.id && (
                        <button
                          type="button"
                          onClick={() => handleOpenComposeModal(item.sender_id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                            color: '#60a5fa',
                            padding: '6px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          <CornerDownRight size={13} />
                          Reply to {item.sender_name?.split(' ')[0] || 'Sender'}
                        </button>
                      )}
                    </div>

                    {/* Detailed Seen by footer for Senders */}
                    {isSentByMe && receipt && receipt.seenCount > 0 && (
                      <div style={{
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                        fontSize: 11.5
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#34d399', fontWeight: 600 }}>
                          <CheckCheck size={14} style={{ color: '#10b981' }} />
                          <span>
                            {receipt.isBroadcast
                              ? `Seen by ${receipt.seenCount} of ${receipt.totalRecipients} workspace members`
                              : receipt.totalRecipients > 1
                              ? `Seen by ${receipt.seenCount} of ${receipt.totalRecipients} recipients`
                              : `Seen by ${receipt.seenNames[0] || 'recipient'}`}
                          </span>
                        </div>

                        {receipt.seenNames.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                            <span style={{ color: '#71717a', fontSize: 11 }}>Viewed by:</span>
                            {receipt.seenNames.map((name, i) => (
                              <span
                                key={i}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  color: '#6ee7b7',
                                  padding: '1px 7px',
                                  borderRadius: 5,
                                  fontSize: 10.5,
                                  fontWeight: 600
                                }}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Icons & Read Status */}
                <div className="ceova-notif-card-side-actions">
                  {isSentByMe && receipt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {receipt.seenCount > 0 ? (
                        <div
                          title={receipt.seenNames.length > 0 ? `Seen by: ${receipt.seenNames.join(', ')}` : 'Seen'}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(16, 185, 129, 0.15)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            color: '#34d399',
                            padding: '4px 9px',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 700
                          }}
                        >
                          <CheckCheck size={14} style={{ color: '#10b981' }} />
                          <span>
                            {receipt.isBroadcast || receipt.totalRecipients > 1
                              ? `Seen (${receipt.seenCount}/${receipt.totalRecipients})`
                              : 'Seen'}
                          </span>
                        </div>
                      ) : (
                        <div
                          title="Delivered to recipients, waiting for view"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            color: '#a1a1aa',
                            padding: '4px 9px',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 600
                          }}
                        >
                          <Check size={13} style={{ color: '#71717a' }} />
                          <span>{receipt.totalRecipients > 1 || receipt.isBroadcast ? 'Delivered (0 seen)' : 'Delivered'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!isRead && !isSentByMe ? (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markNotificationRead(item.id, user);
                        reloadNotifications();
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '6px 10px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600
                      }}
                    >
                      <Check size={13} />
                      Read
                    </button>
                  ) : null}

                  <button
                    type="button"
                    title="Delete notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      padding: 6,
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: 0.6
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* COMPOSE NOTIFICATION MODAL                                               */}
      {/* ========================================================================= */}
      {isComposeOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16
        }}>
          <div className="ceova-notif-modal-card" style={{
            background: 'rgba(14, 18, 28, 0.88)',
            backdropFilter: 'blur(50px) saturate(180%)',
            WebkitBackdropFilter: 'blur(50px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: 20,
            width: '100%',
            maxWidth: 680,
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            {/* Modal Header */}
            <div className="ceova-notif-modal-header" style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa'
                }}>
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                    Send Notification &amp; Message
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    {isAdmin
                      ? 'Admins can broadcast to all or target selected members'
                      : 'Send notification directly to selected team members'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="ceova-notif-modal-body" style={{
              padding: '22px 24px',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 18
            }}>
              {formError && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. AUDIENCE TARGET SELECTION (ROLE CONTROLLED) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 8
                }}>
                  Audience Target
                </label>

                {isAdmin ? (
                  // Admin / CEO gets both options: All or Selected members
                  <div className="ceova-notif-compose-target-grid">
                    <button
                      type="button"
                      onClick={() => setTargetType('all')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: targetType === 'all'
                          ? '1px solid #3b82f6'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: targetType === 'all'
                          ? 'rgba(37, 99, 235, 0.25)'
                          : 'rgba(255, 255, 255, 0.04)',
                        color: targetType === 'all' ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Users size={16} style={{ color: targetType === 'all' ? '#60a5fa' : 'inherit' }} />
                      <span>All Team Members (Broadcast)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTargetType('members')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: targetType === 'members'
                          ? '1px solid #3b82f6'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: targetType === 'members'
                          ? 'rgba(37, 99, 235, 0.25)'
                          : 'rgba(255, 255, 255, 0.04)',
                        color: targetType === 'members' ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <UserCheck size={16} style={{ color: targetType === 'members' ? '#60a5fa' : 'inherit' }} />
                      <span>Specific Members ({selectedRecipientIds.length})</span>
                    </button>
                  </div>
                ) : (
                  // Members & Interns: STRICTLY selected members only
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserCheck size={16} style={{ color: '#60a5fa' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                        Selected Members Only
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11,
                      background: 'rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '2px 8px',
                      borderRadius: 10,
                      fontWeight: 600
                    }}>
                      {selectedRecipientIds.length} chosen
                    </span>
                  </div>
                )}

                {/* If Target is Specific Members: Show Member Search & Checklist */}
                {(targetType === 'members' || !isAdmin) && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 12
                  }}>
                    {/* Search Bar & Quick Toggles */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <div style={{
                        position: 'relative',
                        flex: 1
                      }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Search members to notify..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '7px 10px 7px 32px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 8,
                            color: '#ffffff',
                            fontSize: 12,
                            outline: 'none'
                          }}
                        />
                      </div>

                      {selectedRecipientIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedRecipientIds([])}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'var(--text-muted)',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontSize: 11,
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Member Selection List */}
                    <div style={{
                      maxHeight: 160,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      {filteredSelectableMembers.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                          No matching members found
                        </div>
                      ) : (
                        filteredSelectableMembers.map((member) => {
                          const isSelected = selectedRecipientIds.includes(member.id);

                          return (
                            <div
                              key={member.id}
                              onClick={() => toggleRecipient(member.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 6,
                                    background: '#27272a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#ffffff'
                                  }}>
                                    {(member.full_name || 'U')[0]}
                                  </div>
                                )}
                                <div>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff' }}>
                                    {member.full_name}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                                    {member.designation || member.department || member.email}
                                  </span>
                                </div>
                              </div>

                              <div style={{
                                width: 18,
                                height: 18,
                                borderRadius: 4,
                                border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.2)',
                                background: isSelected ? '#2563eb' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff'
                              }}>
                                {isSelected && <Check size={12} />}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SUBJECT / TITLE */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6
                }}>
                  Notification Subject *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sprint Deliverable Review / Important Update"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              {/* 3. MESSAGE BODY */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6
                }}>
                  Message *
                </label>
                <textarea
                  placeholder="Type your notification message or instructions here..."
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* 4. ATTACHMENTS (STRICTLY LINK, FILES, AND PHOTOS ONLY) */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: 16
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Paperclip size={14} style={{ color: '#60a5fa' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
                      Attachments
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      (Link, Files & Photos Only)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Hidden Photo Input */}
                    <input
                      type="file"
                      ref={photoInputRef}
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#60a5fa',
                        padding: '5px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <ImageIcon size={12} />
                      <span>+ Photo</span>
                    </button>

                    {/* Hidden File Input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#34d399',
                        padding: '5px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <FileText size={12} />
                      <span>+ File</span>
                    </button>
                  </div>
                </div>

                {/* (A) Link Input */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    gap: 8
                  }}>
                    <LinkIcon size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                    <input
                      type="url"
                      placeholder="Attach Link (e.g. https://github.com or Google Meet/Drive URL)"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: 12,
                        outline: 'none'
                      }}
                    />
                    {linkInput && (
                      <button
                        type="button"
                        onClick={() => setLinkInput('')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* (B) Photos Preview List */}
                {photosList.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Attached Photos ({photosList.length})
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                      gap: 8
                    }}>
                      {photosList.map((photo) => (
                        <div
                          key={photo.id}
                          style={{
                            position: 'relative',
                            borderRadius: 6,
                            overflow: 'hidden',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            aspectRatio: '1',
                            background: '#101014'
                          }}
                        >
                          <img
                            src={sanitizeUrl(photo.url)}
                            alt={photo.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(photo.id)}
                            style={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: 'rgba(239, 68, 68, 0.9)',
                              border: 'none',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* (C) Files Preview List */}
                {filesList.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Attached Files ({filesList.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {filesList.map((file) => (
                        <div
                          key={file.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 6,
                            padding: '6px 10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <FileText size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {file.name}
                            </span>
                            {file.size && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                                ({formatFileSize(file.size)})
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(file.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f87171',
                              cursor: 'pointer',
                              padding: 2,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ceova-notif-modal-footer" style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              background: 'rgba(10, 12, 18, 0.6)'
            }}>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-muted)',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendNotification}
                disabled={isSending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  border: '1px solid #3b82f6',
                  color: '#ffffff',
                  padding: '9px 22px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSending ? 'not-allowed' : 'pointer',
                  opacity: isSending ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
                }}
              >
                <Send size={14} />
                <span>{isSending ? 'Sending...' : 'Send Notification'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PHOTO LIGHTBOX MODAL                                                     */}
      {/* ========================================================================= */}
      {activeLightboxPhoto && (
        <div
          onClick={() => setActiveLightboxPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: 16,
            cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '94vw', maxHeight: '90vh' }}>
            <img
              src={activeLightboxPhoto}
              alt="Enlarged preview"
              style={{
                maxWidth: '100%',
                maxHeight: '86vh',
                borderRadius: 12,
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
            <button
              type="button"
              onClick={() => setActiveLightboxPhoto(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
