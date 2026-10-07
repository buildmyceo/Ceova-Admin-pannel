import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient, getAnonSupabaseClient } from '../lib/supabase';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onOpenWaitlist?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const { 
    loginWithEmail, 
    resetPasswordForEmail,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNotCeovaUser, setIsNotCeovaUser] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetSending, setResetSending] = useState(false);

  // Check URL parameters for confirmation or auth feedback
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const queryErrorDesc = searchParams.get('error_description');
    const queryError = searchParams.get('error');

    let hashErrorDesc: string | null = null;
    let hashError: string | null = null;
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      hashErrorDesc = hashParams.get('error_description');
      hashError = hashParams.get('error');
    }

    const errDesc = queryErrorDesc || hashErrorDesc;
    const err = queryError || hashError;

    if (errDesc || err) {
      const displayMsg = errDesc
        ? decodeURIComponent(errDesc.replace(/\+/g, ' '))
        : 'The email verification link is invalid or has expired. Please sign in or reset your password.';
      setErrorMessage(displayMsg);
      // Clean query and hash
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsNotCeovaUser(false);
    setSuccessMessage('');
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    const res = await loginWithEmail(cleanEmail, cleanPassword);
    
    if (res.success) {
      setLoading(false);
      onLoginSuccess();
      return;
    }

    if (res.requiresEmailConfirmation) {
      setSuccessMessage(res.error || 'Confirmation link sent! Please check your email inbox to verify your account.');
      setErrorMessage('');
      setLoading(false);
      return;
    }

    const errText = res.error || 'Authentication failed. Please verify your credentials.';
    setErrorMessage(errText);

    if (errText.toLowerCase().includes('wrong email') || errText.toLowerCase().includes('not registered with ceova') || errText.toLowerCase().includes('not from ceova')) {
      setIsNotCeovaUser(true);
    } else {
      setIsNotCeovaUser(false);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address in the field above to receive a password reset link.');
      return;
    }
    setResetSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setSuccessMessage(res.message || 'Password reset link sent! Check your email inbox and spam folder.');
      } else {
        setErrorMessage(res.error || 'Failed to send password reset email.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error requesting password reset.');
    } finally {
      setResetSending(false);
    }
  };

  const handleActivateAccount = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address above to receive your account activation link.');
      return;
    }
    setResetSending(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setSuccessMessage('Activation link sent! Check your inbox and click the link to set your password and activate your workspace.');
      } else {
        setErrorMessage(res.error || 'Failed to send activation email.');
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error requesting account activation.');
    } finally {
      setResetSending(false);
    }
  };


  return (
    <div
      className="ceova-login-viewport"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100svh',
        backgroundColor: 'transparent',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        zIndex: 50,
      }}
    >
      {/* 1. BACKGROUND VIDEO & POSTER */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/images/sky.png"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 1,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <source
          src="/video/sky.mp4"
          type="video/mp4"
        />
      </video>

      {/* Atmospheric Contrast Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(6, 9, 18, 0.35) 0%, rgba(3, 5, 12, 0.65) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2. CENTERED LOGIN CARD - GLASSMORPHISM (40-60% BLUR) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(12, 16, 26, 0.52)',
          backdropFilter: 'blur(28px) saturate(170%)',
          WebkitBackdropFilter: 'blur(28px) saturate(170%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 16px auto',
              borderRadius: '18px',
              background: '#161618',
              border: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <img
              src="/ceovaimage.png"
              alt="Ceova Logo"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                filter: 'invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                mixBlendMode: 'screen',
                opacity: 0.95
              }}
            />
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              margin: '0 0 6px 0',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            CEOVA
          </h2>

        </div>


        {/* Alert Messages */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: 16,
              color: '#f87171',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1, color: '#f87171' }} />
              <div style={{ flex: 1, lineHeight: 1.45 }}>
                {isNotCeovaUser && (
                  <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 2, fontSize: '13px' }}>
                    Access Restricted
                  </div>
                )}
                <span>{errorMessage}</span>

                {/* If password error, offer fast password reset */}
                {(errorMessage.toLowerCase().includes('incorrect') || errorMessage.toLowerCase().includes('password')) && (
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetSending}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: resetSending ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Lock size={13} />
                      {resetSending ? 'Sending reset link...' : 'Reset My Password via Email'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isNotCeovaUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 6, borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <a
                  href={`mailto:buildmyceo@gmail.com?subject=${encodeURIComponent('CEOVA Portal Access Request')}&body=${encodeURIComponent(`Hello CEOVA Team,\n\nI am requesting access to the CEOVA Portal with my email address: ${email.trim()}\n\nIf this was a mistake, please verify and invite my account.\n\nThank you!`)}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  <Mail size={13} />
                  <span>Mail Support (buildmyceo@gmail.com)</span>
                </a>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: 16,
              color: '#4ade80',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{successMessage}</span>
          </div>
        )}



        {/* Form */}
        <form onSubmit={handleSubmit}>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="name@ceova.online"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label className="form-label" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>
                Password
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetSending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  cursor: resetSending ? 'wait' : 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  opacity: resetSending ? 0.6 : 0.9,
                }}
              >
                {resetSending ? 'Sending reset link...' : 'Forgot password?'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 36px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.15s ease',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              'Processing...'
            ) : (
              <>
                Sign In to Portal <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleActivateAccount}
              disabled={resetSending}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                cursor: resetSending ? 'wait' : 'pointer',
                padding: 0,
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Activate Account
            </button>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetSending}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: resetSending ? 'wait' : 'pointer',
                padding: 0,
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Forgot password?
            </button>
          </div>
          <a
            href="mailto:buildmyceo@gmail.com?subject=CEOVA%20Portal%20Support"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '11.5px',
            }}
          >
            Need assistance?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
