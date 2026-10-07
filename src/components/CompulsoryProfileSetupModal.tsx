import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { 
  ShieldCheck, 
  Upload, 
  Camera, 
  Phone, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+1', country: 'US / Canada' },
  { code: '+91', country: 'India' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' },
  { code: '+86', country: 'China' },
  { code: '+41', country: 'Switzerland' },
  { code: '+31', country: 'Netherlands' },
  { code: '+55', country: 'Brazil' },
  { code: '+27', country: 'South Africa' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
];

export const CompulsoryProfileSetupModal: React.FC = () => {
  const { user, updateCurrentProfile, logout } = useAuth();

  const [avatarUrl, setAvatarUrl] = useState<string>(() => user?.avatar_url || '');
  const [countryCode, setCountryCode] = useState<string>(() => {
    if (user?.phone && user.phone.includes(' ')) {
      return user.phone.split(' ')[0];
    }
    return '+1';
  });
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    if (user?.phone && user.phone.includes(' ')) {
      return user.phone.split(' ').slice(1).join(' ');
    }
    return user?.phone || '';
  });
  const [fullName, setFullName] = useState<string>(() => user?.full_name || '');

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      if (user.avatar_url && !avatarUrl) setAvatarUrl(user.avatar_url);
      if (user.full_name && !fullName) setFullName(user.full_name);
      if (user.phone && !phoneNumber) {
        if (user.phone.includes(' ')) {
          const parts = user.phone.split(' ');
          setCountryCode(parts[0]);
          setPhoneNumber(parts.slice(1).join(' '));
        } else {
          setPhoneNumber(user.phone);
        }
      }
    }
  }, [user]);

  // Handle image upload and optimization
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, or WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10MB limit. Please choose a smaller file.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      // 1. Read file as image and compress via canvas
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
          }

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

          // 2. Attempt upload to Supabase storage 'portal-assets' bucket
          const client = getSupabaseClient();
          if (client) {
            try {
              const res = await fetch(compressedDataUrl);
              const blob = await res.blob();
              const fileName = `avatars/user-${user?.id || 'new'}-${Date.now()}.jpg`;

              const { error: uploadErr } = await client.storage
                .from('portal-assets')
                .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

              if (!uploadErr) {
                const { data: publicUrlData } = client.storage
                  .from('portal-assets')
                  .getPublicUrl(fileName);

                if (publicUrlData?.publicUrl) {
                  setAvatarUrl(publicUrlData.publicUrl);
                  setIsUploading(false);
                  return;
                }
              }
            } catch (storageErr) {
              console.warn('Supabase storage upload fallback to dataURL:', storageErr);
            }
          }

          // Fallback: save optimized compressed data URL directly
          setAvatarUrl(compressedDataUrl);
          setIsUploading(false);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Error handling avatar:', err);
      setErrorMessage('Failed to process image. Please try again.');
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Validate Photo
    if (!avatarUrl || !avatarUrl.trim()) {
      setErrorMessage('Profile photo is compulsory. Please upload your photo before proceeding.');
      return;
    }

    // 2. Validate Phone
    const cleanedDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim() || cleanedDigits.length < 7) {
      setErrorMessage('Phone number is compulsory. Please enter a valid phone number with at least 7 digits.');
      return;
    }

    if (cleanedDigits.length > 15) {
      setErrorMessage('Phone number seems too long. Please verify your phone number.');
      return;
    }

    // 3. Validate Full Name
    if (!fullName.trim()) {
      setErrorMessage('Please confirm your full name.');
      return;
    }

    setIsSubmitting(true);
    const fullPhone = `${countryCode} ${phoneNumber.trim()}`;

    try {
      await updateCurrentProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim(),
        phone: fullPhone,
        status: 'active'
      });
      // The update triggers user change in AuthContext, which will automatically unmount this modal
    } catch (err: any) {
      console.error('Failed to update mandatory profile details:', err);
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
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
          maxWidth: 480,
          background: '#121214',
          border: '1px solid #27272a',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          position: 'relative'
        }}
      >
        {/* Header Block */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#a1a1aa',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 10
          }}>
            <ShieldCheck size={13} style={{ color: '#a1a1aa' }} />
            <span>Workspace Verification</span>
          </div>

          <h2 style={{
            fontSize: 20,
            fontWeight: 600,
            margin: '0 0 6px 0',
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}>
            Complete Your Profile
          </h2>

          <p style={{
            margin: 0,
            fontSize: 13,
            color: '#71717a',
            lineHeight: 1.5,
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Please upload a profile photo and confirm your contact details to access your workspace.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={{
            padding: '10px 12px',
            borderRadius: 8,
            background: '#18181b',
            border: '1px solid #ef4444',
            color: '#f87171',
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* STEP 1: PHOTO UPLOAD */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            transition: 'border-color 0.15s ease'
          }}>
            {/* Avatar Preview */}
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#27272a',
              border: avatarUrl ? '2px solid #22c55e' : '1px solid #3f3f46',
              position: 'relative',
              flexShrink: 0,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Camera size={24} style={{ color: '#71717a' }} />
              )}

              {avatarUrl && (
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#22c55e',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Photo Action / Status */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>
                  Profile Photo <span style={{ color: '#ef4444' }}>*</span>
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: avatarUrl ? '#22c55e' : '#a1a1aa',
                  background: avatarUrl ? '#14291f' : '#27272a',
                  border: avatarUrl ? '1px solid #1e4631' : '1px solid #3f3f46',
                  padding: '1px 6px',
                  borderRadius: 4,
                  textTransform: 'uppercase'
                }}>
                  {avatarUrl ? 'Uploaded' : 'Required'}
                </span>
              </div>

              <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#71717a', lineHeight: 1.4 }}>
                {avatarUrl 
                  ? 'Identity photo saved.' 
                  : 'JPG, PNG, or WebP under 10MB.'}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: avatarUrl ? '#27272a' : '#ffffff',
                  border: avatarUrl ? '1px solid #3f3f46' : 'none',
                  color: avatarUrl ? '#e4e4e7' : '#09090b',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (isUploading) return;
                  e.currentTarget.style.backgroundColor = avatarUrl ? '#3f3f46' : '#e4e4e7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = avatarUrl ? '#27272a' : '#ffffff';
                }}
              >
                <Upload size={13} />
                <span>{isUploading ? 'Processing...' : (avatarUrl ? 'Change Photo' : 'Upload Photo')}</span>
              </button>
            </div>
          </div>

          {/* STEP 2: PHONE NUMBER */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#e4e4e7' }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <span style={{ fontSize: 11, color: '#71717a' }}>
                Required for alerts
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Country Code Dropdown */}
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                style={{
                  width: 130,
                  padding: '9px 10px',
                  borderRadius: 8,
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: '#18181b', color: '#ffffff' }}>
                    {c.code} ({c.country})
                  </option>
                ))}
              </select>

              {/* Number Input */}
              <div style={{ position: 'relative', flex: 1 }}>
                <div style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#71717a',
                  pointerEvents: 'none'
                }}>
                  <Phone size={14} />
                </div>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: 8,
                    background: '#18181b',
                    border: '1px solid #27272a',
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
                />
              </div>
            </div>
          </div>

          {/* STEP 3: FULL NAME */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#e4e4e7', marginBottom: 6 }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717a',
                pointerEvents: 'none'
              }}>
                <UserIcon size={14} />
              </div>
              <input
                type="text"
                required
                placeholder="Your Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 8,
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#52525b'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#ffffff',
              border: 'none',
              color: '#09090b',
              padding: '11px 18px',
              borderRadius: 8,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: (isSubmitting || isUploading) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || isUploading) ? 0.6 : 1,
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && !isUploading) e.currentTarget.style.backgroundColor = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && !isUploading) e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            {isSubmitting ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <span>Complete Setup & Enter Workspace</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Logout Option */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 8,
          borderTop: '1px solid #27272a'
        }}>
          <button
            type="button"
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#71717a'}
          >
            <LogOut size={13} />
            <span>Wrong account? Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
