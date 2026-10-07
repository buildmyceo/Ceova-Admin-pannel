import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, PauseCircle, Mail, Copy, Check, LogOut, ExternalLink } from 'lucide-react';

export const BlockedAccountView: React.FC = () => {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const isPaused = user?.status === 'paused';
  const adminEmail = 'buildmyceo@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(
    `[CEOVA Portal] Request to Unlock / Reactivate Account (${user?.email || 'User'})`
  )}&body=${encodeURIComponent(
    `Hello Administrator,\n\nMy account (${user?.email || ''}) is currently ${isPaused ? 'paused' : 'blocked'}. Please review and restore my workspace access.\n\nThank you,\n${user?.full_name || ''}`
  )}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: '#090b10',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Background Ambience */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0.85) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Container Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: '#12141a',
          border: '1px solid #27272a',
          borderRadius: 20,
          padding: '36px 28px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(239, 68, 68, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 20,
          overflow: 'hidden'
        }}
      >
        {/* Top Accent Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: isPaused ? '#f59e0b' : '#ef4444'
          }}
        />

        {/* Icon & Logo */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: isPaused ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: isPaused ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isPaused ? '#fbbf24' : '#f87171',
              boxShadow: isPaused ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '0 8px 24px rgba(239, 68, 68, 0.15)'
            }}
          >
            {isPaused ? <PauseCircle size={38} strokeWidth={2.2} /> : <ShieldAlert size={38} strokeWidth={2.2} />}
          </div>
        </div>

        {/* Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 100,
            background: isPaused ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: isPaused ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: isPaused ? '#fbbf24' : '#f87171',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}
        >
          <span>{isPaused ? 'Workspace Access Paused' : 'Account Blocked'}</span>
        </div>

        {/* Title & Description */}
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 10px 0',
              letterSpacing: '-0.02em',
              lineHeight: 1.3
            }}
          >
            {isPaused
              ? 'Your Account Has Been Paused by Admin'
              : 'Your Account Has Been Blocked by Admin'}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: '#94a3b8',
              lineHeight: 1.6,
              maxWidth: 420
            }}
          >
            Your access to the CEOVA workspace has been temporarily suspended by an administrator. While your account is inactive, you cannot access company data or tools.
          </p>
        </div>

        {/* Contact Administrator Box */}
        <div
          style={{
            width: '100%',
            background: '#181b22',
            border: '1px solid #272a33',
            borderRadius: 12,
            padding: '16px',
            textAlign: 'left',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            To unlock your account, please contact administrator:
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#0d0f14',
              border: '1px solid #22252e'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <Mail size={15} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminEmail}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyEmail}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#34d399' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                fontWeight: 600,
                padding: '3px 7px',
                borderRadius: 4
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <a
            href={mailtoUrl}
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 16px',
              borderRadius: 8,
              background: '#2563eb',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              boxSizing: 'border-box',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <Mail size={14} />
            <span>Email Administrator to Unlock</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Sign Out Button */}
        <div style={{ width: '100%', paddingTop: 4 }}>
          <button
            type="button"
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              fontSize: 12.5,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.color = '#a1a1aa';
            }}
          >
            <LogOut size={14} />
            <span>Sign Out of This Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
