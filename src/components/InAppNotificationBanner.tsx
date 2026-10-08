import React, { useState, useEffect } from 'react';
import { Bell, X, ExternalLink, Sparkles } from 'lucide-react';

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

  // Auto-dismiss after 6.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div
      role="alert"
      className="in-app-notification-toast"
      style={{
        position: 'fixed',
        top: 76,
        right: 16,
        left: 'auto',
        maxWidth: 420,
        width: 'calc(100vw - 32px)',
        zIndex: 999999,
        background: 'rgba(10, 14, 24, 0.96)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1.5px solid #16a34a',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 16px 50px rgba(0, 0, 0, 0.85), 0 0 25px rgba(22, 163, 74, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        animation: 'slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        color: '#ffffff',
      }}
    >
      {/* Icon / Sender Avatar */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'rgba(22, 163, 74, 0.2)',
          border: '1px solid rgba(22, 163, 74, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          color: '#4ade80',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
        }}
      >
        {activeToast.avatar ? (
          <img
            src={activeToast.avatar}
            alt="Sender"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Bell size={20} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CEOVA Orbit Alert
            </span>
          </div>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Just now</span>
        </div>

        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#ffffff', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeToast.title}
        </div>

        <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 3, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {activeToast.message}
        </div>

        {activeToast.url && (
          <a
            href={activeToast.url}
            onClick={() => setActiveToast(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              color: '#38bdf8',
              marginTop: 6,
              textDecoration: 'none',
            }}
          >
            Open in Workspace <ExternalLink size={10} />
          </a>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={() => setActiveToast(null)}
        aria-label="Dismiss notification"
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#cbd5e1',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};
