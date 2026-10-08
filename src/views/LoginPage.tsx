import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onOpenWaitlist?: () => void;
}

type AuthTab = 'signin' | 'activate';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
}) => {
  const { 
    loginWithEmail, 
    resetPasswordForEmail,
  } = useAuth();

  // Tab State: 'signin' | 'activate'
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Sign In Form States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');
  const [resetSending, setResetSending] = useState(false);

  // Activate Account Form States
  const [activateEmail, setActivateEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Activation Workflow States
  const [isVerifyingInvitation, setIsVerifyingInvitation] = useState(false);
  const [invitationVerified, setInvitationVerified] = useState(false);
  const [verifiedMemberInfo, setVerifiedMemberInfo] = useState<{
    name: string;
    role: string;
    department?: string;
  } | null>(null);
  const [activationError, setActivationError] = useState('');
  const [isNotInvited, setIsNotInvited] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Cooldown countdown effect
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Check URL parameters for confirmation or direct activation tab switch
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const queryTab = searchParams.get('tab') || searchParams.get('mode');
    const queryEmail = searchParams.get('email');
    if (queryTab === 'activate') {
      setActiveTab('activate');
      if (queryEmail) setActivateEmail(decodeURIComponent(queryEmail));
    }

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
      setSignInError(displayMsg);
      // Clean query and hash
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // --------------------------------------------------------------------------
  // 1. SIGN IN SUBMIT HANDLER
  // --------------------------------------------------------------------------
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInSuccess('');
    setSignInLoading(true);

    const cleanEmail = signInEmail.trim().toLowerCase();
    const cleanPassword = signInPassword;

    const res = await loginWithEmail(cleanEmail, cleanPassword);
    
    if (res.success) {
      setSignInLoading(false);
      onLoginSuccess();
      return;
    }

    if (res.requiresEmailConfirmation) {
      setSignInSuccess(res.error || 'Confirmation pending. Please check your email inbox to verify your account.');
      setSignInError('');
      setSignInLoading(false);
      return;
    }

    setSignInError(res.error || 'Incorrect email or password. Please verify your credentials or activate your account.');
    setSignInLoading(false);
  };

  // --------------------------------------------------------------------------
  // 2. FORGOT PASSWORD HANDLER
  // --------------------------------------------------------------------------
  const handleForgotPassword = async () => {
    const cleanEmail = signInEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setSignInError('Please enter your email address in the field above to receive a password reset link.');
      return;
    }
    setResetSending(true);
    setSignInError('');
    setSignInSuccess('');
    try {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setSignInSuccess(res.message || 'Password reset link sent! Check your email inbox and spam folder.');
      } else {
        setSignInError(res.error || 'Failed to send password reset email.');
      }
    } catch (e: any) {
      setSignInError(e?.message || 'Error requesting password reset.');
    } finally {
      setResetSending(false);
    }
  };

  // --------------------------------------------------------------------------
  // 3. STEP 1: VERIFY INVITATION HANDLER
  // --------------------------------------------------------------------------
  const handleVerifyInvitation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = activateEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setActivationError('Please enter a valid email address to verify your invitation.');
      return;
    }

    setIsVerifyingInvitation(true);
    setActivationError('');
    setIsNotInvited(false);
    setInvitationVerified(false);
    setVerifiedMemberInfo(null);

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Database connection is not available.');

      const { data, error } = await client.functions.invoke('send-notification-email', {
        body: {
          action: 'verify-invitation',
          to: [cleanEmail],
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to connect to verification service.');
      }

      if (data && data.isInvited) {
        // SUCCESS: Member IS invited! Reveal password box!
        setInvitationVerified(true);
        setIsNotInvited(false);
        setVerifiedMemberInfo({
          name: data.name || cleanEmail.split('@')[0],
          role: data.role || 'Member',
          department: data.department || '',
        });
      } else {
        // NOT INVITED: Do NOT show password box, do NOT create database rows!
        setInvitationVerified(false);
        setIsNotInvited(true);
        setActivationError(data?.error || 'This email is not invited to CEOVA Orbit. Access is restricted to invited team members only.');
      }
    } catch (err: any) {
      setActivationError(err?.message || 'Verification service unreachable. Please try again.');
    } finally {
      setIsVerifyingInvitation(false);
    }
  };

  // --------------------------------------------------------------------------
  // 4. STEP 2: DISPATCH 6-DIGIT ACTIVATION CODE (OTP)
  // --------------------------------------------------------------------------
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = activateEmail.trim().toLowerCase();

    if (!newPassword || newPassword.length < 6) {
      setActivationError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setActivationError('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSendingOtp(true);
    setActivationError('');

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Database connection is not available.');

      const { data, error } = await client.functions.invoke('send-notification-email', {
        body: {
          action: 'send-activation-otp',
          to: [cleanEmail],
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to dispatch verification code.');
      }

      if (data && data.success) {
        setOtpSent(true);
        setOtpCooldown(60);
        setOtpCode('');
      } else {
        setActivationError(data?.error || 'Unable to send verification code. Please try again.');
      }
    } catch (err: any) {
      setActivationError(err?.message || 'Error sending verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // --------------------------------------------------------------------------
  // 5. STEP 3: VERIFY OTP & LOG IN DIRECTLY
  // --------------------------------------------------------------------------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = activateEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim().replace(/\s+/g, '');

    if (!cleanOtp || cleanOtp.length !== 6) {
      setActivationError('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setActivationError('');

    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Database connection is not available.');

      const { data, error } = await client.functions.invoke('send-notification-email', {
        body: {
          action: 'verify-activation-otp',
          to: [cleanEmail],
          otp: cleanOtp,
          password: newPassword,
        }
      });

      if (error) {
        throw new Error(error.message || 'Verification service error.');
      }

      if (data && data.success && data.activated) {
        // Log in immediately using the established password!
        const loginRes = await loginWithEmail(cleanEmail, newPassword);
        if (loginRes.success) {
          onLoginSuccess();
          return;
        }

        // Fallback: switch to sign in tab
        setActiveTab('signin');
        setSignInEmail(cleanEmail);
        setSignInSuccess('Account activated successfully! Please sign in with your password.');
      } else {
        setActivationError(data?.error || 'Incorrect or expired verification code.');
      }
    } catch (err: any) {
      setActivationError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Reset activation flow if user wants to change email
  const handleResetActivationEmail = () => {
    setInvitationVerified(false);
    setVerifiedMemberInfo(null);
    setIsNotInvited(false);
    setActivationError('');
    setNewPassword('');
    setConfirmPassword('');
    setOtpSent(false);
    setOtpCode('');
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
        backgroundColor: '#07090e',
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

      {/* Atmospheric Contrast Gradient Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 30%, rgba(6, 9, 18, 0.45) 0%, rgba(3, 5, 12, 0.78) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2. CENTERED CARD - GLASSMORPHISM */}
      <div className="ceova-login-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="ceova-login-header-logo-box">
            <img
              src="/ceovaimage.png"
              alt="CEOVA Logo"
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

          <h2 className="ceova-login-title">
            CEOVA <span style={{ color: '#38bdf8', fontWeight: 700 }}>ORBIT</span>
          </h2>
          <p className="ceova-login-subtitle">
            Enterprise Workspace Operating System
          </p>
        </div>

        {/* 3. MODE SELECTOR TABS (Sign In vs Activate Account) */}
        <div className="ceova-login-tabs-container">
          <button
            type="button"
            className="ceova-login-tab-btn"
            onClick={() => {
              setActiveTab('signin');
              setSignInError('');
            }}
            style={{
              background: activeTab === 'signin' ? '#2563eb' : 'transparent',
              color: activeTab === 'signin' ? '#ffffff' : '#94a3b8',
              boxShadow: activeTab === 'signin' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
            }}
          >
            <KeyRound size={14} />
            Sign In
          </button>

          <button
            type="button"
            className="ceova-login-tab-btn"
            onClick={() => {
              setActiveTab('activate');
              setActivationError('');
            }}
            style={{
              background: activeTab === 'activate' ? '#16a34a' : 'transparent',
              color: activeTab === 'activate' ? '#ffffff' : '#94a3b8',
              boxShadow: activeTab === 'activate' ? '0 4px 14px rgba(22, 163, 74, 0.35)' : 'none',
            }}
          >
            <Sparkles size={14} />
            Activate Account
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SIGN IN MODE (For existing users with credentials)                   */}
        {/* ========================================================================= */}
        {activeTab === 'signin' && (
          <div>
            {/* Error Message Alert */}
            {signInError && (
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
                  alignItems: 'flex-start',
                  gap: 10,
                  lineHeight: 1.45,
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1, color: '#f87171' }} />
                <div style={{ flex: 1 }}>
                  <span>{signInError}</span>
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('activate');
                        if (signInEmail) setActivateEmail(signInEmail);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        padding: 0,
                        fontSize: '12px',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      }}
                    >
                      Are you an invited member? Activate account here &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message Alert */}
            {signInSuccess && (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: 16,
                  color: '#4ade80',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  lineHeight: 1.45,
                }}
              >
                <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{signInSuccess}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSignInSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', marginBottom: 6 }}>
                  Workspace Email
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="ceova-login-input"
                    placeholder="name@ceova.online"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    style={{
                      padding: '11px 12px 11px 36px',
                    }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
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
                    }}
                  >
                    {resetSending ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    className="ceova-login-input"
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    style={{
                      padding: '11px 42px 11px 36px',
                    }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)', pointerEvents: 'none' }} />
                  <button
                    type="button"
                    className="ceova-login-eye-btn"
                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                    aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  >
                    {showSignInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="ceova-login-btn-primary"
                disabled={signInLoading}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 4px 18px rgba(37, 99, 235, 0.45)',
                  opacity: signInLoading ? 0.7 : 1,
                }}
              >
                {signInLoading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In to CEOVA Orbit <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Invited to CEOVA Orbit?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('activate');
                    if (signInEmail) setActivateEmail(signInEmail);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4ade80',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Activate your account here &rarr;
                </button>
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ACTIVATE ACCOUNT MODE (Strictly Gated for Invited Members)         */}
        {/* ========================================================================= */}
        {activeTab === 'activate' && (
          <div>
            {/* Case A: OTP 6-Digit Verification Code Screen */}
            {otpSent ? (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    margin: '0 auto 14px auto',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ade80',
                    boxShadow: '0 0 25px rgba(34, 197, 94, 0.25)',
                  }}
                >
                  <ShieldCheck size={28} />
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                  Enter Verification Code
                </h3>

                <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                  We sent a 6-digit code to:
                  <br />
                  <strong style={{ color: '#4ade80' }}>{activateEmail}</strong>
                </p>

                {activationError && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '10px',
                      padding: '11px 13px',
                      marginBottom: 16,
                      color: '#f87171',
                      fontSize: '12.5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      textAlign: 'left',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{activationError}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp}>
                  <div style={{ marginBottom: 18 }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      autoFocus
                      placeholder="000000"
                      className="ceova-login-otp-box"
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setOtpCode(val);
                        setActivationError('');
                      }}
                    />
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: 8 }}>
                      Code expires in 10 minutes &bull; Check your Inbox or Spam
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="ceova-login-btn-primary"
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                      opacity: (isVerifyingOtp || otpCode.length !== 6) ? 0.6 : 1,
                    }}
                  >
                    {isVerifyingOtp ? (
                      'Verifying & Logging In...'
                    ) : (
                      <>
                        Verify Code &amp; Enter Workspace <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <button
                      type="button"
                      disabled={otpCooldown > 0 || isSendingOtp}
                      onClick={() => handleSendOtp()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: otpCooldown > 0 ? '#64748b' : '#4ade80',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer',
                        padding: '8px 0',
                        minHeight: 38,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {otpCooldown > 0 ? `Resend code in ${otpCooldown}s` : 'Resend Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '8px 0',
                        minHeight: 38,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      &larr; Back to edit password
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Case B: Standard Activation Workflow (Step 1 + Step 2) */
              <div>
                <p style={{ margin: '0 0 16px 0', fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5 }}>
                  Enter your invited email address to verify your invitation and establish your workspace password.
                </p>

                {/* Error Banner */}
                {activationError && (
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
                      alignItems: 'flex-start',
                      gap: 10,
                      lineHeight: 1.45,
                    }}
                  >
                    <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1, color: '#f87171' }} />
                    <div style={{ flex: 1 }}>
                      {isNotInvited && (
                        <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>
                          Access Restricted
                        </div>
                      )}
                      <span>{activationError}</span>

                      {isNotInvited && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={`mailto:buildmyceo@gmail.com?subject=${encodeURIComponent('CEOVA Orbit Access Request')}&body=${encodeURIComponent(`Hello CEOVA Team,\n\nI am requesting access to the CEOVA Portal with my email: ${activateEmail.trim()}\n\nThank you!`)}`}
                            style={{
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.25)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <Mail size={12} /> Contact Administrator (buildmyceo@gmail.com)
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 1: Email Input & Verification */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)' }}>
                      Invited Email Address
                    </label>
                    {invitationVerified && (
                      <button
                        type="button"
                        onClick={handleResetActivationEmail}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <RefreshCw size={11} /> Change Email
                      </button>
                    )}
                  </div>

                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="invited@company.com"
                      value={activateEmail}
                      disabled={invitationVerified}
                      onChange={(e) => {
                        setActivateEmail(e.target.value);
                        setActivationError('');
                        setIsNotInvited(false);
                      }}
                      className="ceova-login-input"
                      style={{
                        padding: '11px 12px 11px 36px',
                        background: invitationVerified ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                        border: invitationVerified ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                      }}
                    />
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: invitationVerified ? '#4ade80' : 'rgba(255, 255, 255, 0.4)' }} />
                  </div>

                  {/* Verify Invitation Button (Only shown if NOT yet verified) */}
                  {!invitationVerified && (
                    <button
                      type="button"
                      onClick={() => handleVerifyInvitation()}
                      disabled={isVerifyingInvitation || !activateEmail.trim()}
                      className="ceova-login-btn-primary"
                      style={{
                        marginTop: 12,
                        background: '#16a34a',
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                        opacity: (isVerifyingInvitation || !activateEmail.trim()) ? 0.6 : 1,
                        cursor: (isVerifyingInvitation || !activateEmail.trim()) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isVerifyingInvitation ? (
                        'Verifying Invitation...'
                      ) : (
                        <>
                          <ShieldCheck size={16} /> Check &amp; Verify Invitation
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Step 2: NEW BOX APPEARS (Only if verified as invited!) */}
                {invitationVerified && (
                  <form onSubmit={handleSendOtp} style={{ marginTop: 18 }}>
                    {/* Verified Banner */}
                    <div
                      style={{
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        marginBottom: 18,
                        color: '#4ade80',
                        fontSize: '12.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Invitation Verified!</strong> Welcome,{' '}
                        <span style={{ color: '#ffffff', fontWeight: 600 }}>{verifiedMemberInfo?.name}</span> ({verifiedMemberInfo?.role?.toUpperCase()}).
                      </div>
                    </div>

                    {/* The Two Password Inputs */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: 18,
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Lock size={15} style={{ color: '#4ade80' }} />
                        Create Your Workspace Password
                      </div>

                      {/* Password 1 */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
                          Password (minimum 6 characters)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="ceova-login-input"
                            style={{
                              padding: '10px 42px 10px 12px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="ceova-login-eye-btn"
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Password 2 (Confirm) */}
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>
                          Confirm Password (enter 2nd time)
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter password to confirm"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            className="ceova-login-input"
                            style={{
                              padding: '10px 42px 10px 12px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="ceova-login-eye-btn"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      {/* Real-time match feedback */}
                      {confirmPassword.length > 0 && (
                        <div style={{ fontSize: '11.5px', marginTop: 4 }}>
                          {newPassword === confirmPassword ? (
                            <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={13} /> Passwords match
                            </span>
                          ) : (
                            <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertCircle size={13} /> Passwords do not match yet
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSendingOtp || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                      className="ceova-login-btn-primary"
                      style={{
                        background: '#16a34a',
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                        opacity: (isSendingOtp || !newPassword || newPassword !== confirmPassword || newPassword.length < 6) ? 0.6 : 1,
                        cursor: (isSendingOtp || !newPassword || newPassword !== confirmPassword || newPassword.length < 6) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isSendingOtp ? (
                        'Sending 6-Digit Code...'
                      ) : (
                        <>
                          Get 6-Digit Verification Code <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      padding: '8px 12px',
                      minHeight: 40,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Already have an active account?{' '}
                    <strong style={{ color: '#60a5fa', textDecoration: 'underline', marginLeft: 4 }}>Sign In here</strong>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Global Footer */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <a
            href="mailto:buildmyceo@gmail.com?subject=CEOVA%20Orbit%20Support"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '11.5px',
            }}
          >
            CEOVA Orbit Security &bull; Need help? Contact Admin
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
