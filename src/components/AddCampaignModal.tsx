'use client';
import { useState } from 'react';
import CreatorAvatar from './CreatorAvatar';
import { Creator, PLATFORM_CONFIG, PlatformKey } from '@/lib/types';

interface Props {
  creator: Creator;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    spent: number;
    start_date: string;
    end_date: string;
    platforms: Record<string, { views: number; likes: number; comments: number; shares: number; daily: number[] }>;
  }) => void;
}

export default function AddCampaignModal({ creator, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [spent, setSpent] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  // Per-platform view inputs
  const [ttViews, setTtViews] = useState('');
  const [ytViews, setYtViews] = useState('');
  const [igViews, setIgViews] = useState('');

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-[18px] p-8 w-[480px] max-w-[92vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        <div className="flex items-center gap-3 mb-5">
          <CreatorAvatar name={creator.name} size={36} imageUrl={creator.avatar_url} />
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Log Campaign</h3>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>for {creator.name}</div>
          </div>
        </div>

        {/* Campaign Name */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
            Campaign Name
          </label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blox Fruits March Push"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
        </div>

        {/* Amount Spent */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
            Amount Spent ($)
          </label>
          <input value={spent} onChange={e => setSpent(e.target.value)} placeholder="e.g. 1500" type="number"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
              Start Date
            </label>
            <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
              End Date
            </label>
            <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
        </div>

        {/* Platform Views */}
        <div className="mb-2">
          <label className="block text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--muted)' }}>
            Total Views per Platform
          </label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'tiktok' as PlatformKey, val: ttViews, set: setTtViews },
              { key: 'youtube' as PlatformKey, val: ytViews, set: setYtViews },
              { key: 'instagram' as PlatformKey, val: igViews, set: setIgViews },
            ]).map(({ key, val, set }) => {
              const cfg = PLATFORM_CONFIG[key];
              return (
                <div key={key}>
                  <label className="flex items-center gap-1 text-[10px] font-bold mb-1" style={{ color: cfg.color }}>
                    {cfg.icon} {cfg.label}
                  </label>
                  <input value={val} onChange={e => set(e.target.value)} placeholder="0" type="number"
                    className="w-full px-2.5 py-2 rounded-lg text-sm font-mono outline-none"
                    style={{ border: `1px solid ${cfg.color}33`, background: cfg.bg, color: 'var(--text)' }} />
                </div>
              );
            })}
          </div>
        </div>

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
                  spent: Number(spent) || 0,
                  start_date: startDate,
                  end_date: endDate || startDate,
                  platforms: {
                    tiktok: { views: Number(ttViews) || 0, likes: 0, comments: 0, shares: 0, daily: [] },
                    youtube: { views: Number(ytViews) || 0, likes: 0, comments: 0, shares: 0, daily: [] },
                    instagram: { views: Number(igViews) || 0, likes: 0, comments: 0, shares: 0, daily: [] },
                  },
                });
              }
            }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
            style={{
              background: 'linear-gradient(135deg, #ff2d55, #c837ab)',
              opacity: name.trim() && spent ? 1 : 0.4,
            }}>
            Log Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
