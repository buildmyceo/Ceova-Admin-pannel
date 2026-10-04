import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePortalData } from '../context/PortalDataContext';
import { 
  X, 
  ShieldCheck, 
  Clock, 
  Send, 
  UserCheck, 
  Building, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Crown
} from 'lucide-react';
import { UserRole } from '../types';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToCEO?: () => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  onSwitchToCEO
}) => {
  const { quickLoginAs } = useAuth();
  const { submitWaitlistRequest, waitlistRequests } = usePortalData();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Development');
  const [requestedRole, setRequestedRole] = useState<UserRole>('member');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submittedId, setSubmittedId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !reason.trim()) return;

    await submitWaitlistRequest({
      full_name: fullName.trim(),
      email: email.trim(),
      requested_role: requestedRole,
      department,
      phone: phone.trim() || undefined,
      reason: reason.trim()
    });

    setSubmittedId('WL-' + Math.floor(1000 + Math.random() * 9000));
    setStep('success');
  };

  const handleTestCEOPerspective = () => {
    quickLoginAs('ceo');
    onClose();
    if (onSwitchToCEO) onSwitchToCEO();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content bento-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: 560, 
          padding: 0, 
          overflow: 'hidden',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.1)'
        }}
      >
        {/* Top Classical Banner with Ceova Logo */}
        <div style={{ 
          padding: '24px 28px 20px', 
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative'
        }}>
          <button 
            type="button" 
            className="btn-modal-close" 
            onClick={onClose}
            style={{ 
              position: 'absolute', 
              top: 18, 
              right: 18, 
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ 
              padding: '6px 10px', 
              background: 'rgba(0, 0, 0, 0.4)', 
              borderRadius: 12, 
              border: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 0 16px rgba(212, 175, 55, 0.2)'
            }}>
              <img 
                src="/ceovaimage.png" 
                alt="Ceova Logo" 
                style={{ height: 32, width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  // Fallback if image fails to render
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="neo-sub-roman" style={{ fontSize: 9.5 }}>CEOVA TEAM OPERATING SYSTEM</div>
              <h3 className="neo-serif-title" style={{ fontSize: 20, margin: '2px 0 0', color: '#fff' }}>
                {step === 'form' ? 'Executive Access Clearance' : 'Waiting List Status'}
              </h3>
            </div>
          </div>

          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Ceova Team OS is an invitation-only proprietary operations system. All admissions require vetting and clearance from <strong>Founder & CEO Harshit</strong>.
          </p>
        </div>

        {/* Content Body */}
        {step === 'form' ? (
          <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Full Legal Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  required
                  placeholder="e.g. Rohan Gupta" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Work Email *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    required
                    placeholder="name@ceova.tech" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="+91 98765 43210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Requested Department *</label>
                  <select 
                    className="select-field" 
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Development">Development (CCTV & AI)</option>
                    <option value="Marketing & Design">Marketing & Brand</option>
                    <option value="Operations">Operations & Supply Chain</option>
                    <option value="Finance">Finance & Treasury</option>
                    <option value="Executive">Executive Governance</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Requested Role *</label>
                  <select 
                    className="select-field" 
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                  >
                    <option value="member">Core Team Member / Engineer</option>
                    <option value="intern">Fellowship Intern</option>
                    <option value="cto">Technical Lead / Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Clearance Justification & Skill Dossier *</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  required
                  placeholder="Briefly state your specialization (e.g. Embedded C++, INT8 quantization, 3D CAD modeling) and why you need access to Ceova Team OS."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={12} style={{ color: 'var(--neo-gold)' }} />
                <span>Encrypted & routed to CEO</span>
              </div>

              <button type="submit" className="neu-pill-btn primary" style={{ padding: '8px 20px' }}>
                <Send size={14} />
                <span>Submit Clearance Dossier</span>
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
            <div className="neu-inset-box" style={{ 
              width: 72, 
              height: 72, 
              borderRadius: 24, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 16px',
              color: 'var(--neo-gold)',
              boxShadow: '0 0 24px rgba(212, 175, 55, 0.25)'
            }}>
              <Clock size={36} />
            </div>

            <span className="badge-gold" style={{ fontSize: 11, letterSpacing: '0.08em', marginBottom: 8, display: 'inline-block' }}>
              WAITLIST DOSSIER #{submittedId} QUEUED
            </span>

            <h3 className="neo-serif-title" style={{ fontSize: 22, color: '#fff', margin: '8px 0 10px' }}>
              Pending CEO Executive Review
            </h3>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 20px' }}>
              Your clearance dossier has been submitted. <strong>Founder & CEO Harshit</strong> has been notified on his executive command deck.
            </p>

            <div className="neu-inset-box" style={{ padding: '16px 20px', textAlign: 'left', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Applicant:</span>
                <strong style={{ color: '#fff' }}>{fullName} ({email})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                <span style={{ color: 'var(--neo-gold)', fontWeight: 600 }}>{department}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className="status-pill status-in_progress" style={{ fontSize: 10 }}>WAITLIST • PENDING REVIEW</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button 
                type="button" 
                className="neu-pill-btn primary" 
                style={{ width: '100%', justifyContent: 'center', padding: '10px 16px' }}
                onClick={handleTestCEOPerspective}
              >
                <Crown size={14} />
                <span>Switch to CEO Perspective & Review Request</span>
              </button>
              
              <button 
                type="button" 
                className="neu-pill-btn" 
                style={{ width: '100%', justifyContent: 'center', padding: '8px 16px' }}
                onClick={onClose}
              >
                Return to Ceova OS
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
