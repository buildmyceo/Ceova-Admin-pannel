import React, { useState, useEffect, useMemo } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: string | number;
  border?: string;
  title?: string;
}

const GRADIENTS = [
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
  'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
  'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
  'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', // Indigo
];

function getGradientForName(name?: string | null): string {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 40,
  fontSize,
  className,
  style,
  borderRadius = '50%',
  border,
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error when src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = useMemo(() => {
    if (!name || !name.trim()) return 'U';
    return name.trim().charAt(0).toUpperCase();
  }, [name]);

  const backgroundGradient = useMemo(() => getGradientForName(name), [name]);
  const calculatedFontSize = fontSize || Math.max(11, Math.round(size * 0.38));

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    borderRadius,
    border: border || 'none',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    userSelect: 'none',
    background: (!src || hasError) ? backgroundGradient : '#161618',
    ...style,
  };

  if (!src || hasError) {
    return (
      <div 
        className={className} 
        style={containerStyle} 
        title={title || name || undefined}
      >
        <span style={{ 
          fontSize: calculatedFontSize, 
          fontWeight: 700, 
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}>
          {initial}
        </span>
      </div>
    );
  }

  // Route Supabase storage URLs through our same-origin proxy to bypass local network/Cisco DNS blocks
  const resolvedSrc = useMemo(() => {
    if (!src) return undefined;
    if (src.includes('supabase.co/storage/')) {
      const parts = src.split('/storage/');
      if (parts[1]) {
        return `/supabase-storage/${parts[1]}`;
      }
    }
    return src;
  }, [src]);

  return (
    <div 
      className={className} 
      style={containerStyle} 
      title={title || name || undefined}
    >
      <img
        src={resolvedSrc}
        alt={name || 'Avatar'}
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
};
