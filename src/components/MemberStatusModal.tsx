import React, { useState } from 'react';
import { Profile, UserStatus } from '../types';
import { usePortalData } from '../context/PortalDataContext';
import { 
  ShieldAlert, 
  PauseCircle, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2,
  Lock,
  Unlock
} from 'lucide-react';

interface MemberStatusModalProps {
  isOpen: boolean;
  member: Profile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MemberStatusModal: React.FC<MemberStatusModalProps> = ({
  isOpen,
  member,
  onClose,
  onSuccess
}) => {
  const { updateMemberStatus } = usePortalData();
  const [selectedAction, setSelectedAction] = useState<'pause' | 'block' | 'activate'>('pause');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const isCurrentlyRestricted = member.status === 'blocked' || member.status === 'paused';

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    let targetStatus: UserStatus = 'active';
    if (!isCurrentlyRestricted) {
      targetStatus = selectedAction === 'block' ? 'blocked' : 'paused';
    } else {
      targetStatus = 'active';
    }

    try {
      const res = await updateMemberStatus(member.id, targetStatus);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(res.error || 'Failed to update member status.');
      }
    } catch (e: any) {
      setError(e?.message || 'Error updating status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#121214',
          border: '1px solid #27272a',
          borderRadius: 16,
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflow: 'hidden'
        }}
      >
        {/* Top Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: isCurrentlyRestricted
              ? '#22c55e'
              : selectedAction === 'block'
              ? '#ef4444'
              : '#f59e0b'
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isCurrentlyRestricted
                  ? 'rgba(34, 197, 94, 0.12)'
                  : selectedAction === 'block'
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                border: isCurrentlyRestricted
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : selectedAction === 'block'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCurrentlyRestricted
                  ? '#4ade80'
                  : selectedAction === 'block'
                  ? '#f87171'
                  : '#fbbf24'
              }}
            >
              {isCurrentlyRestricted ? (
                <Unlock size={20} />
              ) : selectedAction === 'block' ? (
                <ShieldAlert size={20} />
              ) : (
                <PauseCircle size={20} />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                {isCurrentlyRestricted ? 'Reactivate Member Access' : 'Manage Member Access'}
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#a1a1aa' }}>
                Target user: <strong style={{ color: '#ffffff' }}>{member.full_name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Member Details Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: '#18181b',
            border: '1px solid #27272a'
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#27272a',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                {(member.full_name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {member.full_name}
            </div>
            <div style={{ fontSize: 11.5, color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {member.email} • <span style={{ textTransform: 'capitalize' }}>{member.role}</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '3px 8px',
              borderRadius: 6,
              background: member.status === 'blocked' ? '#3b1212' : member.status === 'paused' ? '#38250b' : '#14291f',
              color: member.status === 'blocked' ? '#f87171' : member.status === 'paused' ? '#fbbf24' : '#4ade80',
              border: member.status === 'blocked' ? '1px solid #571e1e' : member.status === 'paused' ? '1px solid #59390f' : '1px solid #1e4631'
            }}
          >
            {member.status || 'Active'}
          </div>
        </div>

        {/* Action Selection (if not restricted) */}
        {!isCurrentlyRestricted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#d4d4d8' }}>
              Select Restriction Type:
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div
                onClick={() => setSelectedAction('pause')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: selectedAction === 'pause' ? 'rgba(245, 158, 11, 0.08)' : '#18181b',
                  border: selectedAction === 'pause' ? '1px solid #f59e0b' : '1px solid #27272a',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>
                  <PauseCircle size={15} />
                  <span>Pause Access</span>
                </div>
                <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>
                  Temporarily lock workspace access. Can be resumed anytime.
                </div>
              </div>

              <div
                onClick={() => setSelectedAction('block')}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  background: selectedAction === 'block' ? 'rgba(239, 68, 68, 0.08)' : '#18181b',
                  border: selectedAction === 'block' ? '1px solid #ef4444' : '1px solid #27272a',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 13, fontWeight: 600 }}>
                  <ShieldAlert size={15} />
                  <span>Block Account</span>
                </div>
                <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>
                  Strictly block user from logging in or using portal.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              fontSize: 12.5,
              color: '#86efac',
              lineHeight: 1.5
            }}
          >
            Clicking Confirm will immediately restore <strong>{member.full_name}</strong>'s access, allowing them to access the CEOVA dashboard and tasks normally.
          </div>
        )}

        {/* Warning Notification Box */}
        {!isCurrentlyRestricted && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              fontSize: 12,
              color: '#fca5a5',
              lineHeight: 1.45
            }}
          >
            <AlertTriangle size={15} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <span>
              Once confirmed, this user will immediately see a restricted screen explaining that their account has been {selectedAction === 'block' ? 'blocked' : 'paused'} by an administrator, with contact details to request unlocking.
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ padding: '8px 12px', borderRadius: 6, background: '#271515', border: '1px solid #ef4444', color: '#f87171', fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: 8,
              background: '#27272a',
              border: '1px solid #3f3f46',
              color: '#e4e4e7',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 18px',
              borderRadius: 8,
              background: isCurrentlyRestricted
                ? '#16a34a'
                : selectedAction === 'block'
                ? '#dc2626'
                : '#d97706',
              border: 'none',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : isCurrentlyRestricted ? (
              <>
                <Unlock size={14} />
                <span>Confirm Reactivation</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Confirm {selectedAction === 'block' ? 'Block' : 'Pause'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
