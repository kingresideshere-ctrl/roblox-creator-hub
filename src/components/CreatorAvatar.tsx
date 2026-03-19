'use client';
import { useState } from 'react';
import { getInitials, generateGradient, hashColor } from '@/lib/utils';

interface Props {
  name: string;
  size?: number;
  imageUrl?: string | null;
  loading?: boolean;
}

export default function CreatorAvatar({ name, size = 42, imageUrl, loading }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const gradient = generateGradient(name);
  const radius = size * 0.28;

  if (imageUrl && !imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        flexShrink: 0, position: 'relative',
        boxShadow: `0 4px 12px ${hashColor(name)}33`,
        overflow: 'hidden',
      }}>
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="animate-spin-slow" style={{
              width: size * 0.3, height: size * 0.3,
              border: '2px solid rgba(255,255,255,0.25)',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
            }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 800, color: '#fff',
      letterSpacing: -0.5, fontFamily: "'Space Grotesk', sans-serif",
      flexShrink: 0, position: 'relative',
      boxShadow: `0 4px 12px ${hashColor(name)}33`,
    }}>
      {loading ? (
        <div className="animate-spin-slow" style={{
          width: size * 0.35, height: size * 0.35,
          border: '2px solid rgba(255,255,255,0.25)',
          borderTop: '2px solid #fff',
          borderRadius: '50%',
        }} />
      ) : initials}
    </div>
  );
}
