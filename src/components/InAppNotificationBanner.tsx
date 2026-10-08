import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';

interface NotificationToast {
  id: string;
  title: string;
  message: string;
  avatar?: string;
  url?: string;
  timestamp: string;
}

export const InAppNotificationBanner: React.FC = () => {
  const [activeToast, setActiveToast] = useState<NotificationToast | null>(null);

  useEffect(() => {
    const handleNotification = (e: any) => {
      if (e.detail) {
        setActiveToast(e.detail);
      }
    };

    window.addEventListener('ceova_inapp_notification', handleNotification);
    return () => {
      window.removeEventListener('ceova_inapp_notification', handleNotification);
    };
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        left: 'auto',
        maxWidth: 380,
        width: 'calc(100vw - 32px)',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(34, 197, 94, 0.2)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        animation: 'slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#ffffff',
      }}
    >
      {/* Icon / Avatar */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          color: '#4ade80',
        }}
      >
        {activeToast.avatar ? (
          <img
            src={activeToast.avatar}
            alt="Sender"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Bell size={18} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            In-App Notification
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Just now</span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeToast.title}
        </div>

        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {activeToast.message}
        </div>

        {activeToast.url && (
          <a
            href={activeToast.url}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: '#38bdf8',
              marginTop: 6,
              textDecoration: 'none',
            }}
          >
            View Details <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => setActiveToast(null)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          flexShrink: 0,
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
};
