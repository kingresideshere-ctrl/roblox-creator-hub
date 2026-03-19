'use client';
import { useState, useEffect, useRef } from 'react';
import CreatorAvatar from './CreatorAvatar';
import { PLATFORM_CONFIG, PlatformKey } from '@/lib/types';

interface Props {
  onClose: () => void;
  onAdd: (data: {
    name: string;
    tiktok_url: string;
    youtube_url: string;
    instagram_url: string;
    avatar_url: string | null;
    display_name: string | null;
  }) => void;
}

function useProfileFetch(url: string, platform: string) {
  const [profile, setProfile] = useState<{ avatar: string | null; displayName: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastUrl = useRef('');

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed || trimmed.length < 15 || trimmed === lastUrl.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setLoading(true);

    timeoutRef.current = setTimeout(async () => {
      lastUrl.current = trimmed;
      try {
        const res = await fetch(`/api/profile?url=${encodeURIComponent(trimmed)}&platform=${platform}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch {}
      setLoading(false);
    }, 800);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [url, platform]);

  return { profile, loading };
}

function LinkInput({ label, platform, value, onChange }: {
  label: string; platform: PlatformKey; value: string; onChange: (v: string) => void;
}) {
  const cfg = PLATFORM_CONFIG[platform];
  const hasValue = value.trim().length > 10;
  return (
    <div className="mb-4">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase mb-1.5"
        style={{ color: cfg.color }}>
        <span className="w-[18px] h-[18px] rounded flex items-center justify-center text-[10px]"
          style={{ background: cfg.bg }}>{cfg.icon}</span>
        {label}
      </label>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={`https://${platform === 'tiktok' ? 'tiktok.com/@username' : platform === 'youtube' ? 'youtube.com/@channel' : 'instagram.com/username'}`}
        className="w-full px-3.5 py-2.5 rounded-lg text-[13px] font-mono outline-none transition-all"
        style={{
          border: hasValue ? `1px solid ${cfg.color}44` : '1px solid var(--border)',
          background: hasValue ? cfg.bg : 'var(--surface)',
          color: 'var(--text)',
        }}
      />
    </div>
  );
}

export default function AddCreatorModal({ onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');

  const ttProfile = useProfileFetch(tiktok, 'tiktok');
  const ytProfile = useProfileFetch(youtube, 'youtube');
  const igProfile = useProfileFetch(instagram, 'instagram');

  const bestAvatar = ytProfile.profile?.avatar || ttProfile.profile?.avatar || igProfile.profile?.avatar || null;
  const bestDisplayName = ytProfile.profile?.displayName || ttProfile.profile?.displayName || igProfile.profile?.displayName || null;
  const anyLoading = ttProfile.loading || ytProfile.loading || igProfile.loading;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-[18px] p-8 w-[460px] max-w-[92vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Live Preview */}
        {name.trim() && (
          <div className="flex items-center gap-3.5 mb-6 p-3.5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CreatorAvatar name={name} size={52} imageUrl={bestAvatar} loading={anyLoading} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[17px] font-bold" style={{ color: 'var(--text)' }}>{name}</span>
                {bestDisplayName && bestDisplayName !== name && (
                  <span className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>({bestDisplayName})</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { p: 'tiktok' as PlatformKey, prof: ttProfile },
                  { p: 'youtube' as PlatformKey, prof: ytProfile },
                  { p: 'instagram' as PlatformKey, prof: igProfile },
                ].map(({ p, prof }) => {
                  const url = p === 'tiktok' ? tiktok : p === 'youtube' ? youtube : instagram;
                  if (!url.trim()) return null;
                  const cfg = PLATFORM_CONFIG[p];
                  return (
                    <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.icon} {p}
                      {prof.loading && <span style={{ color: 'var(--muted)' }}>⏳</span>}
                      {prof.profile?.avatar && !prof.loading && <span style={{ color: '#00e676' }}>✓</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <h3 className="text-lg font-bold mb-5" style={{ color: 'var(--text)' }}>Add Creator</h3>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
            Creator Name
          </label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BloxKing"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>

        <LinkInput label="TikTok Profile" platform="tiktok" value={tiktok} onChange={setTiktok} />
        <LinkInput label="YouTube Channel" platform="youtube" value={youtube} onChange={setYoutube} />
        <LinkInput label="Instagram Profile" platform="instagram" value={instagram} onChange={setInstagram} />

        <div className="flex gap-2.5 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onAdd({
                  name: name.trim(),
                  tiktok_url: tiktok.trim() || '',
                  youtube_url: youtube.trim() || '',
                  instagram_url: instagram.trim() || '',
                  avatar_url: bestAvatar,
                  display_name: bestDisplayName,
                });
                onClose();
              }
            }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
            style={{
              background: 'linear-gradient(135deg, #ff2d55, #c837ab)',
              opacity: name.trim() ? 1 : 0.4,
              pointerEvents: name.trim() ? 'auto' : 'none',
            }}>
            Add Creator
          </button>
        </div>
      </div>
    </div>
  );
}
