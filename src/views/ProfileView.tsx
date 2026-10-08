import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import { sanitizeSocialLink, sanitizeUrl, validateAttachmentFile } from '../lib/security';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Shield, 
  Check, 
  Sparkles,
  Camera,
  Trash2,
  Loader2,
  Edit2,
  Upload,
  Copy,
  ExternalLink,
  FileText,
  CheckCircle2,
  Globe,
  Plus,
  Smartphone,
  Download,
  Bell,
  BellRing,
  Share2
} from 'lucide-react';
import { UserStatus } from '../types';
import { 
  isStandaloneApp, 
  triggerPwaInstall, 
  getNotificationPermission, 
  requestNotificationPermission, 
  dispatchInAppNotification,
  playNotificationChime 
} from '../lib/pushNotifications';

interface ImageEditorProps {
  imageSrc: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [sketchMode, setSketchMode] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  React.useEffect(() => {
    draw();
  }, [scale, brightness, sketchMode, offsetX, offsetY]);

  const draw = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    // Apply filters
    let filter = `brightness(${brightness}%)`;
    if (sketchMode) {
      filter += ` grayscale(100%) contrast(150%)`;
    }
    ctx.filter = filter;

    const minDim = Math.min(img.width, img.height);
    const drawWidth = (img.width / minDim) * size * scale;
    const drawHeight = (img.height / minDim) * size * scale;

    const centerX = size / 2;
    const centerY = size / 2;

    const dx = centerX - drawWidth / 2 + offsetX;
    const dy = centerY - drawHeight / 2 + offsetY;

    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
    ctx.filter = 'none';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveClick = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20
    }}>
      <div className="glass-panel" style={{ padding: 24, width: '100%', maxWidth: 440 }}>
        <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 18 }}>Adjust Avatar</h3>
        
        <div style={{ width: '100%', aspectRatio: '1/1', background: '#000', borderRadius: 12, overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab' }}>
          <canvas 
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%', display: 'block' }} 
          />
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-subtle)', marginTop: 8 }}>
          Drag to reposition image
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, color: 'var(--text-muted)' }}>
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <input 
            type="range" min="0.5" max="3" step="0.1" value={scale} 
            onChange={e => setScale(parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, color: 'var(--text-muted)' }}>
            <span>Brightness</span>
            <span>{brightness}%</span>
          </div>
          <input 
            type="range" min="50" max="150" step="1" value={brightness} 
            onChange={e => setBrightness(parseFloat(e.target.value))} 
            style={{ width: '100%', accentColor: 'var(--accent-primary)' }} 
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input 
            type="checkbox" id="sketch-mode" 
            checked={sketchMode} onChange={e => setSketchMode(e.target.checked)} 
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <label htmlFor="sketch-mode" style={{ fontSize: 13, color: 'var(--text-main)' }}>
            Enable Sketch Filter
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSaveClick}>Apply & Save</button>
        </div>
      </div>
    </div>
  );
};
export const ProfileView: React.FC = () => {
  const { user, role, updateCurrentProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [countryCode, setCountryCode] = useState(() => {
    if (user?.phone && user.phone.includes(' ')) {
      return user.phone.split(' ')[0];
    }
    return '+1';
  });
  const [phone, setPhone] = useState(() => {
    if (user?.phone && user.phone.includes(' ')) {
      return user.phone.split(' ').slice(1).join(' ');
    }
    return user?.phone || '';
  });
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState<UserStatus>(user?.status || 'active');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_url || '');
  const [skillsText, setSkillsText] = useState((user?.skills || []).join(', '));
  
  const [linkedin, setLinkedin] = useState(user?.social_links?.linkedin || '');
  const [github, setGithub] = useState(user?.social_links?.github || '');
  const [instagram, setInstagram] = useState(user?.social_links?.instagram || '');
  const [twitter, setTwitter] = useState(user?.social_links?.twitter || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);

  // Mobile PWA & Push Notifications States
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => getNotificationPermission());
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => isStandaloneApp());
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const [copiedMobileLink, setCopiedMobileLink] = useState<boolean>(false);
  const [testNotifSent, setTestNotifSent] = useState<boolean>(false);

  useEffect(() => {
    const handleInstallable = () => setIsAppInstalled(isStandaloneApp());
    window.addEventListener('ceova_pwa_installable', handleInstallable);
    window.addEventListener('ceova_pwa_installed', () => setIsAppInstalled(true));
    return () => {
      window.removeEventListener('ceova_pwa_installable', handleInstallable);
      window.removeEventListener('ceova_pwa_installed', () => setIsAppInstalled(true));
    };
  }, []);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      dispatchInAppNotification(
        'Notifications Active!',
        'You will now receive instant in-app sound and device push alerts for tasks and team updates.',
        { avatar: user?.avatar_url }
      );
    }
  };

  const handleTestNotification = () => {
    setTestNotifSent(true);
    try {
      playNotificationChime();
    } catch (_) {}
    dispatchInAppNotification(
      'CEOVA Orbit In-App Alert',
      `Hello ${user?.full_name || 'Team Member'}! In-app notifications and sound alerts are working properly.`,
      { avatar: user?.avatar_url }
    );
    setTimeout(() => setTestNotifSent(false), 2500);
  };

  const handleInstallPwa = async () => {
    const success = await triggerPwaInstall();
    if (success) {
      setIsAppInstalled(true);
    } else {
      alert("To install on Android: In Chrome, tap the ⋮ menu in the top-right and select 'Install app' or 'Add to Home screen'.");
    }
  };

  // Sync component state whenever user changes or updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDesignation(user.designation || '');
      if (user.phone && user.phone.includes(' ')) {
        const parts = user.phone.split(' ');
        setCountryCode(parts[0]);
        setPhone(parts.slice(1).join(' '));
      } else {
        setPhone(user.phone || '');
      }
      setBio(user.bio || '');
      setStatus(user.status || 'active');
      setAvatarUrl(user.avatar_url || '');
      setCoverUrl(user.cover_url || '');
      setSkillsText((user.skills || []).join(', '));
      setLinkedin(user.social_links?.linkedin || '');
      setGithub(user.social_links?.github || '');
      setInstagram(user.social_links?.instagram || '');
      setTwitter(user.social_links?.twitter || '');
    }
  }, [user]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAttachmentFile(file, 'photo');
    if (!validation.valid) {
      alert(validation.error || 'Invalid photo file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditorImageSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateAttachmentFile(file, 'photo');
    if (!validation.valid) {
      alert(validation.error || 'Invalid cover image file.');
      if (coverInputRef.current) coverInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const client = getSupabaseClient();
      if (client) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `cover-${user?.id || 'user'}-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await client.storage
          .from('portal-assets')
          .upload(fileName, file, { upsert: true });

        if (!uploadErr) {
          const { data: publicUrlData } = client.storage
            .from('portal-assets')
            .getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            setCoverUrl(publicUrlData.publicUrl);
            setIsUploading(false);
            if (coverInputRef.current) coverInputRef.current.value = '';
            return;
          }
        }
      }

      // Fallback to Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverUrl(event.target?.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading cover photo:', err);
      setIsUploading(false);
    }
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleEditorSave = async (dataUrl: string) => {
    setEditorImageSrc(null);
    setIsUploading(true);
    try {
      const client = getSupabaseClient();
      if (client) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const fileName = `avatar-${user?.id || 'user'}-${Date.now()}.jpg`;
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
      }
      setAvatarUrl(dataUrl);
    } catch {
      setAvatarUrl(dataUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    alert("Profile photo is compulsory for all workspace members. You can replace your photo by clicking 'Upload Photo', but you cannot leave it blank.");
  };

  const handleRemoveCover = async () => {
    setCoverUrl('');
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!avatarUrl || !avatarUrl.trim()) {
      alert("Profile photo is compulsory. Please upload a photo before saving.");
      return;
    }
    
    const cleanedDigits = phone.replace(/\D/g, '');
    if (!phone.trim() || cleanedDigits.length < 7) {
      alert("Phone number is compulsory and must contain at least 7 valid digits.");
      return;
    }

    const fullPhone = `${countryCode} ${phone.trim()}`;

    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    await updateCurrentProfile({
      full_name: fullName.trim(),
      designation: designation.trim(),
      phone: fullPhone,
      bio: bio.trim() || undefined,
      status,
      avatar_url: avatarUrl.trim(),
      cover_url: coverUrl.trim(),
      skills: skillsArray,
      social_links: {
        linkedin: linkedin.trim(),
        github: github.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
      }
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsEditing(false);
    }, 1500);
  };

  const getSocialLink = (platform: string, rawValue?: string | null) => {
    return sanitizeSocialLink(platform, rawValue);
  };

  const renderCoverPhoto = () => (
    <div 
      className="profile-cover-photo-wrap"
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: 260, 
        backgroundColor: '#09090b',
        backgroundImage: coverUrl ? `url("${sanitizeUrl(coverUrl)}")` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderTopLeftRadius: 'var(--radius-xl)',
        borderTopRightRadius: 'var(--radius-xl)',
        overflow: 'hidden'
      }}>
      {/* Solid dark base border */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: coverUrl ? 'rgba(0,0,0,0.2)' : 'transparent',
        pointerEvents: 'none'
      }} />

      {!coverUrl && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-subtle)' }}>
          <Sparkles size={32} opacity={0.3} />
        </div>
      )}
      {isEditing && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2 }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => coverInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: '#ffffff', color: '#000000', border: 'none', fontWeight: 600 }}
          >
            <Camera size={14} /> {coverUrl ? 'Change Cover (1211x681)' : 'Upload Cover (1211x681)'}
          </button>
          {coverUrl && (
             <button 
               type="button" 
               className="btn btn-secondary" 
               onClick={handleRemoveCover}
               style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(0,0,0,0.6)' }}
             >
               <Trash2 size={14} /> Remove
             </button>
          )}
        </div>
      )}
    </div>
  );

  if (!isEditing) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="page-title-wrap">
            <h2 className="neo-serif-title" style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#ffffff' }}>
              My Profile & Personal Preferences
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Manage your executive credentials, personal avatar, and system visibility
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => setIsEditing(true)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              background: '#ffffff', 
              color: '#000000', 
              border: 'none', 
              fontWeight: 600,
              padding: '9px 18px',
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(255, 255, 255, 0.12)'
            }}
          >
            <Edit2 size={15} /> Edit Profile
          </button>
        </div>

        {/* Main Profile Card in Glassmorphism */}
        <div 
          className="bento-card" 
          style={{ 
            padding: 0, 
            overflow: 'hidden', 
            background: 'rgba(12, 16, 26, 0.52)', 
            backdropFilter: 'blur(28px) saturate(170%)',
            WebkitBackdropFilter: 'blur(28px) saturate(170%)',
            border: '1px solid rgba(255, 255, 255, 0.11)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
          }}
        >
          {renderCoverPhoto()}

          <div className="profile-card-content" style={{ padding: '0 32px 32px', position: 'relative' }}>
            {/* Identity Row: Overlapping Avatar and Action Row */}
            <div 
              className="profile-identity-header-row"
              style={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                justifyContent: 'space-between',
                gap: 20, 
                marginTop: -58, 
                marginBottom: 20,
                flexWrap: 'wrap'
              }}
            >
              <div style={{ position: 'relative' }}>
                <div 
                  style={{ 
                    width: 114, 
                    height: 114, 
                    borderRadius: '50%',
                    border: '4px solid #0d0d0f',
                    background: '#161618',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  {user?.avatar_url ? (
                    <img src={sanitizeUrl(user.avatar_url)} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, fontWeight: 700, color: '#ffffff' }}>
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>

                {/* Status indicator pulse */}
                <div 
                  title="Status: Active"
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '3px solid #0d0d0f'
                  }}
                />
              </div>

              {/* Status Pill Badge - Solid Colors, No Neon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 100,
                  background: '#161618',
                  border: '1px solid #27272a',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  <span>{user?.status === 'away' ? 'Away' : user?.status === 'in_meeting' ? 'In Meeting' : 'Active & Online'}</span>
                </div>
              </div>
            </div>

            {/* User Title & Credentials (Completely in the dark body section! Never overlaid on cover photo!) */}
            <div style={{ marginBottom: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ 
                  fontSize: 26, 
                  fontWeight: 800, 
                  margin: 0, 
                  color: '#ffffff',
                  letterSpacing: '-0.02em'
                }}>
                  {user?.full_name}
                </h1>
                
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: user?.role === 'ceo' ? 'rgba(56, 189, 248, 0.12)' : '#18181b',
                  border: user?.role === 'ceo' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid #27272a',
                  color: user?.role === 'ceo' ? '#38bdf8' : '#ffffff',
                  textTransform: 'uppercase'
                }}>
                  <Shield size={11} style={{ color: user?.role === 'ceo' ? '#38bdf8' : undefined }} />
                  {user?.role === 'ceo' ? 'CEO' : user?.role === 'admin' ? 'ADMIN' : user?.role === 'intern' ? 'INTERN' : 'MEMBER'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Briefcase size={14} style={{ color: 'var(--text-subtle)' }} />
                  <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{user?.designation || (user?.role === 'ceo' ? 'Chief Executive Officer' : user?.role === 'admin' ? 'Administrator' : 'Team Member')}</span>
                </div>
                <span style={{ color: 'var(--text-subtle)' }}>•</span>
                <span style={{ color: 'var(--text-muted)' }}>{user?.department || (user?.role === 'ceo' ? 'Executive' : user?.role === 'admin' ? 'Administration' : 'General')}</span>
              </div>

              {/* Social Channels Row */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {user?.social_links?.linkedin && (
                  <a 
                    href={getSocialLink('linkedin', user.social_links.linkedin)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="LinkedIn Profile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e4e4e7',
                      fontSize: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0a66c2' }}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                    <span>LinkedIn</span>
                    <ExternalLink size={10} style={{ color: 'var(--text-subtle)' }} />
                  </a>
                )}
                {user?.social_links?.github && (
                  <a 
                    href={getSocialLink('github', user.social_links.github)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="GitHub Profile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e4e4e7',
                      fontSize: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7a5.44 5.44 0 0 0-1.5-3.89 5.07 5.07 0 0 0-.14-3.83s-1.23-.4-4 1.44a13.38 13.38 0 0 0-7 0C4.23 1.28 3 1.68 3 1.68a5.07 5.07 0 0 0-.14 3.83 5.44 5.44 0 0 0-1.5 3.89c0 5.42 3.3 6.61 6.44 7A4.8 4.8 0 0 0 7 18v4"></path></svg>
                    <span>GitHub</span>
                    <ExternalLink size={10} style={{ color: 'var(--text-subtle)' }} />
                  </a>
                )}
                {user?.social_links?.instagram && (
                  <a 
                    href={getSocialLink('instagram', user.social_links.instagram)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="Instagram Profile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e4e4e7',
                      fontSize: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#e1306c' }}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                    <span>Instagram</span>
                    <ExternalLink size={10} style={{ color: 'var(--text-subtle)' }} />
                  </a>
                )}
                {user?.social_links?.twitter && (
                  <a 
                    href={getSocialLink('twitter', user.social_links.twitter)} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title="X Profile"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: '#e4e4e7',
                      fontSize: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5 5 9 5 9c1.4 0 2.8-.4 4-1C4.4 7.6 2 5.5 2 3c3.2 2.7 7.5 4 12 4 .6-3.8 5-5.5 8-3z"></path></svg>
                    <span>X</span>
                    <ExternalLink size={10} style={{ color: 'var(--text-subtle)' }} />
                  </a>
                )}
                {(!user?.social_links || Object.values(user.social_links).every(v => !v)) && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      color: 'var(--text-muted)',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={11} /> Connect Social Links
                  </button>
                )}
              </div>
            </div>

            {/* Modern Bento Grid for Details */}
            <div className="profile-bento-grid">
              {/* Card 1: Contact Information */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                    <Mail size={14} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Contact Information
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Mail size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (user?.email) {
                          navigator.clipboard.writeText(user.email);
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 1800);
                        }
                      }}
                      title="Copy email to clipboard"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedEmail ? '#10b981' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11
                      }}
                    >
                      {copiedEmail ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 6, border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} style={{ color: 'var(--text-subtle)', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: user?.phone ? '#f4f4f5' : 'var(--text-muted)' }}>
                        {user?.phone || 'Not provided'}
                      </span>
                    </div>
                    {user?.phone && (
                      <span style={{ fontSize: 10, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: 4 }}>
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 2: Skills & Specializations */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      <Sparkles size={14} />
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Skills & Specializations
                    </h3>
                  </div>
                  {(!user?.skills || user.skills.length === 0) && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Skills
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {user?.skills && user.skills.length > 0 ? (
                    user.skills.map((skill, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          padding: '5px 12px', 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)', 
                          borderRadius: 100, 
                          fontSize: 12, 
                          color: '#f4f4f5',
                          fontWeight: 500
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <div style={{ width: '100%', color: 'var(--text-subtle)', fontSize: 12, fontStyle: 'italic', padding: '10px 0' }}>
                      No skills added yet. Add core proficiencies and leadership competencies.
                    </div>
                  )}
                </div>
              </div>

              {/* Card 3: Executive Bio (Full Width) */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gridColumn: '1 / -1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                      <FileText size={14} />
                    </div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Bio & Overview
                    </h3>
                  </div>
                  {!user?.bio && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      + Add Bio
                    </button>
                  )}
                </div>

                {user?.bio ? (
                  <p style={{
                    fontSize: 13,
                    color: '#e4e4e7',
                    lineHeight: 1.6,
                    margin: 0,
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '14px 16px',
                    borderRadius: 8,
                    borderLeft: '3px solid rgba(255, 255, 255, 0.2)',
                    fontStyle: 'normal'
                  }}>
                    {user.bio}
                  </p>
                ) : (
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    color: 'var(--text-subtle)',
                    fontSize: 12,
                    fontStyle: 'italic',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 6
                  }}>
                    No executive bio provided. Click "Edit Profile" to write a summary of your leadership focus.
                  </div>
                )}
              </div>

              {/* Card 4: CEOVA Orbit Mobile App (Android & iOS) & In-App Notifications */}
              <div 
                className="profile-mobile-app-card"
                style={{
                  gridColumn: '1 / -1',
                  background: 'linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '22px 24px',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Header with Title and PWA Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)' }}>
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.01em' }}>
                        CEOVA Orbit Mobile App (Android &amp; iOS)
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#94a3b8' }}>
                        Install as a native app on your phone with in-app audio &amp; push notifications.
                      </p>
                    </div>
                  </div>

                  <span style={{
                    padding: '5px 12px',
                    borderRadius: 100,
                    fontSize: 11,
                    fontWeight: 700,
                    background: isAppInstalled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    border: `1px solid ${isAppInstalled ? '#16a34a' : 'rgba(255, 255, 255, 0.15)'}`,
                    color: isAppInstalled ? '#4ade80' : '#cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isAppInstalled ? '#22c55e' : '#94a3b8' }} />
                    {isAppInstalled ? 'Installed on This Device' : 'Ready to Install'}
                  </span>
                </div>

                {/* Sub-grid: 3 Columns on desktop, 1 on mobile */}
                <div className="profile-mobile-apps-grid" style={{ marginTop: 16 }}>
                  
                  {/* Column 1: Android App */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>🤖</span>
                        <strong style={{ fontSize: 13, color: '#ffffff' }}>Android App</strong>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                        Runs full-screen with native app performance and background notifications.
                      </p>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={handleInstallPwa}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Download size={14} /> Install on Android
                      </button>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                        Or tap Chrome ⋮ menu &rarr; "Install app"
                      </div>
                    </div>
                  </div>

                  {/* Column 2: iOS (iPhone & iPad) */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>🍏</span>
                        <strong style={{ fontSize: 13, color: '#ffffff' }}>iOS (iPhone / iPad)</strong>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                        Add directly to your iPhone Home Screen via Safari with standalone icon.
                      </p>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setShowIosGuide(!showIosGuide)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          fontWeight: 700,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Share2 size={14} /> {showIosGuide ? 'Hide iOS Steps' : 'View iOS Instructions'}
                      </button>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
                        Safari &rarr; Share button &rarr; "Add to Home Screen"
                      </div>
                    </div>
                  </div>

                  {/* Column 3: In-App & Push Notifications Controller */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <BellRing size={16} style={{ color: '#4ade80' }} />
                        <strong style={{ fontSize: 13, color: '#ffffff' }}>In-App &amp; Push Alerts</strong>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px 0', lineHeight: 1.5 }}>
                        Status:{' '}
                        <span style={{ color: notificationPermission === 'granted' ? '#4ade80' : '#f59e0b', fontWeight: 600 }}>
                          {notificationPermission === 'granted' ? 'Active & Enabled' : 'Permission Required'}
                        </span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {notificationPermission !== 'granted' ? (
                        <button
                          type="button"
                          onClick={handleEnableNotifications}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          <Bell size={13} /> Enable Notifications
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleTestNotification}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: 8,
                            background: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.35)',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          {testNotifSent ? <Check size={13} /> : <Sparkles size={13} />}
                          {testNotifSent ? 'Test Alert Dispatched!' : 'Send Test Notification'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('https://portal.ceovaai.com');
                          setCopiedMobileLink(true);
                          setTimeout(() => setCopiedMobileLink(false), 2000);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedMobileLink ? '#4ade80' : '#94a3b8',
                          fontSize: 11,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4
                        }}
                      >
                        {copiedMobileLink ? <Check size={11} /> : <Copy size={11} />}
                        {copiedMobileLink ? 'Mobile Link Copied!' : 'Copy Mobile Portal Link'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable iOS Step-by-Step Instructions */}
                {showIosGuide && (
                  <div style={{
                    marginTop: 16,
                    padding: '16px 18px',
                    borderRadius: 12,
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: 12.5,
                    color: '#cbd5e1',
                    lineHeight: 1.6
                  }}>
                    <strong style={{ color: '#ffffff', display: 'block', marginBottom: 6 }}>
                      How to install on iPhone &amp; iPad:
                    </strong>
                    <div>1. Open <strong>Safari</strong> on your iPhone and visit <strong>https://portal.ceovaai.com</strong>.</div>
                    <div>2. Tap the <strong>Share button</strong> at the bottom of the screen (the square icon with an arrow pointing up 📤).</div>
                    <div>3. Scroll down the share menu and select <strong>"Add to Home Screen"</strong> (➕).</div>
                    <div>4. Tap <strong>"Add"</strong> in the top-right corner.</div>
                    <div style={{ marginTop: 6, color: '#4ade80' }}>
                      &check; The CEOVA Orbit app icon is now on your home screen and operates as a native standalone app!
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 40 }}>
      {editorImageSrc && (
        <ImageEditor 
          imageSrc={editorImageSrc} 
          onSave={handleEditorSave} 
          onCancel={() => setEditorImageSrc(null)} 
        />
      )}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="page-title-wrap">
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>Edit Profile</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0 0' }}>Update your personal credentials, contact info, and executive bio.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsEditing(false)}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e4e4e7',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          Cancel Editing
        </button>
      </div>

      <div style={{
        background: 'rgba(12, 16, 26, 0.52)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        border: '1px solid rgba(255, 255, 255, 0.11)',
        borderRadius: 20,
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        overflow: 'hidden'
      }}>
        <form onSubmit={handleSave}>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/webp, image/gif"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
          <input
            type="file"
            ref={coverInputRef}
            accept="image/png, image/jpeg, image/webp, image/gif"
            style={{ display: 'none' }}
            onChange={handleCoverSelect}
          />

          {renderCoverPhoto()}

          <div className="profile-card-content profile-edit-content" style={{ padding: '0 28px 28px', position: 'relative' }}>
            <div 
              className="profile-edit-avatar-row"
              style={{ 
                display: 'flex', alignItems: 'flex-end', gap: 20, 
                marginTop: -50, marginBottom: 24 
              }}
            >
              <div 
                style={{ position: 'relative', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to upload profile photo"
              >
                <div 
                  className="user-avatar-wrap" 
                  style={{ 
                    width: 104, 
                    height: 104, 
                    borderRadius: '50%',
                    border: '4px solid #0d0d0f',
                    background: '#161618',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12)'
                  }}
                >
                  {avatarUrl ? (
                    <img 
                      src={sanitizeUrl(avatarUrl)} 
                      alt={fullName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div className="avatar-fallback" style={{ fontSize: 32, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {fullName.charAt(0) || 'U'}
                    </div>
                  )}

                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isUploading ? 1 : 0,
                      transition: 'opacity 0.2s ease',
                      color: '#fff',
                      gap: 4
                    }}
                    className="avatar-hover-overlay"
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { if (!isUploading) e.currentTarget.style.opacity = '0'; }}
                  >
                    {isUploading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Camera size={20} />
                        <span style={{ fontSize: 10, fontWeight: 600 }}>Change</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ paddingBottom: 8, flex: 1 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload size={13} />
                    <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: 12, padding: '6px 14px', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={13} />
                      <span>Change Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {savedSuccess && (
              <div 
                style={{ 
                  background: 'var(--success-bg)', 
                  border: '1px solid rgba(16,185,129,0.3)', 
                  color: 'var(--success)', 
                  padding: '10px 14px', 
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Check size={16} />
                <span>Profile details updated successfully!</span>
              </div>
            )}

            <div className="profile-form-grid-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Title / Designation</label>
                <input
                  type="text"
                  className="form-input"
                  value={designation}
                  disabled
                  title="Your designation is fixed and cannot be changed"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Compulsory)</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select 
                  className="form-input" 
                  style={{ width: 130 }}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+49">+49 (DE)</option>
                  <option value="+33">+33 (FR)</option>
                </select>
                <input
                  type="tel"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Skills & Specializations (Comma separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="React, Rust, PyTorch, Cloud Architecture"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
              />
            </div>

            <div className="profile-form-grid-row" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">LinkedIn (ID or URL)</label>
                <input type="text" className="form-input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="e.g. janesmith or https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">GitHub (ID or URL)</label>
                <input type="text" className="form-input" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="e.g. janesmith or https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">Instagram (ID or URL)</label>
                <input type="text" className="form-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="e.g. janesmith or https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">X / Twitter (ID or URL)</label>
                <input type="text" className="form-input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="e.g. janesmith or https://..." />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Bio & Overview</label>
              <textarea
                className="form-textarea"
                style={{ minHeight: 110 }}
                placeholder="Tell colleagues about your role and focus areas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, gap: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Profile Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
