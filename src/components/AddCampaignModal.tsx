'use client';
import { useState } from 'react';
import CreatorAvatar from './CreatorAvatar';
import { Creator, PLATFORM_CONFIG, PlatformKey } from '@/lib/types';
import { formatNum } from '@/lib/utils';

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
  const [game, setGame] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const [ttStats, setTtStats] = useState({ views: 0, likes: 0, comments: 0, shares: 0 });
  const [ytStats, setYtStats] = useState({ views: 0, likes: 0, comments: 0, shares: 0 });
  const [igStats, setIgStats] = useState({ views: 0, likes: 0, comments: 0, shares: 0 });

  const [fetchUrl, setFetchUrl] = useState('');
  const [fetchPlatform, setFetchPlatform] = useState<PlatformKey>('tiktok');
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<string | null>(null);

  const statsMap: Record<PlatformKey, { stats: any; set: any }> = {
    tiktok: { stats: ttStats, set: setTtStats },
    youtube: { stats: ytStats, set: setYtStats },
    instagram: { stats: igStats, set: setIgStats },
  };

  const handleAutoFetch = async () => {
    if (!fetchUrl.trim()) return;
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch('/api/fetch-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fetchUrl.trim(), platform: fetchPlatform }),
      });
      const data = await res.json();
      if (data.views || data.likes || data.comments || data.shares) {
        const setter = statsMap[fetchPlatform].set;
        setter((prev: any) => ({
          views: (prev.views || 0) + (data.views || 0),
          likes: (prev.likes || 0) + (data.likes || 0),
          comments: (prev.comments || 0) + (data.comments || 0),
          shares: (prev.shares || 0) + (data.shares || 0),
        }));
        setFetchResult(`Added ${formatNum(data.views || 0)} views, ${formatNum(data.likes || 0)} likes`);
      } else {
        setFetchResult('Could not extract stats. Enter numbers manually below.');
      }
    } catch {
      setFetchResult('Failed to fetch. Try entering stats manually.');
    }
    setFetching(false);
    setFetchUrl('');
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-[18px] p-8 w-[540px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        <div className="flex items-center gap-3 mb-5">
          <CreatorAvatar name={creator.name} size={36} imageUrl={creator.avatar_url} />
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Log Campaign</h3>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>for {creator.name}</div>
          </div>
        </div>

        {/* Campaign Name + Game */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Campaign Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. March Push"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Roblox Game</label>
            <input value={game} onChange={e => setGame(e.target.value)} placeholder="e.g. Blox Fruits"
              list="game-list"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
            <datalist id="game-list">
              {['Adopt Me', 'Blox Fruits', 'Brookhaven', 'Pet Simulator X', 'Murder Mystery 2', 'Arsenal', 'Tower of Hell', 'Jailbreak', 'Royal High', 'King Legacy', 'Anime Defenders', 'Bee Swarm Simulator'].map(g => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Spend + Dates */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Spend ($)</label>
            <input value={spent} onChange={e => setSpent(e.target.value)} placeholder="1500" type="number"
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Start</label>
            <input value={startDate} onChange={e => setStartDate(e.target.value)} type="date"
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>End</label>
            <input value={endDate} onChange={e => setEndDate(e.target.value)} type="date"
              className="w-full px-3 py-2.5 rounded-lg text-sm font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
          </div>
        </div>

        {/* Auto-Fetch */}
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--accent)' }}>⚡ Auto-Fetch Stats from URL</div>
          <div className="text-[11px] mb-3" style={{ color: 'var(--muted)' }}>Paste a video/post URL to auto-pull views and engagement</div>
          <div className="flex gap-2 mb-2">
            <select value={fetchPlatform} onChange={e => setFetchPlatform(e.target.value as PlatformKey)}
              className="px-2 py-2 rounded-lg text-xs font-semibold outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', minWidth: 100 }}>
              {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <input value={fetchUrl} onChange={e => setFetchUrl(e.target.value)} placeholder="Paste video/post URL..."
              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
              onKeyDown={e => { if (e.key === 'Enter') handleAutoFetch(); }} />
            <button onClick={handleAutoFetch} disabled={fetching || !fetchUrl.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border-none text-white"
              style={{ background: fetching ? 'var(--muted)' : 'linear-gradient(135deg, #ff2d55, #c837ab)', opacity: !fetchUrl.trim() ? 0.4 : 1 }}>
              {fetching ? '...' : 'Fetch'}
            </button>
          </div>
          {fetchResult && (
            <div className="text-[11px] px-2 py-1.5 rounded-md mt-1"
              style={{ background: fetchResult.includes('Added') ? 'rgba(0,230,118,0.08)' : 'rgba(255,215,64,0.08)', color: fetchResult.includes('Added') ? '#00e676' : '#ffd740' }}>
              {fetchResult}
            </div>
          )}
        </div>

        {/* Platform Stats */}
        <div className="text-[11px] font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--muted)' }}>Platform Stats</div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([pKey, pCfg]) => {
            const { stats, set } = statsMap[pKey];
            return (
              <div key={pKey} className="p-3 rounded-xl" style={{ background: pCfg.bg, border: `1px solid ${pCfg.color}22` }}>
                <div className="text-[10px] font-bold mb-2" style={{ color: pCfg.color }}>{pCfg.icon} {pCfg.label}</div>
                <div className="flex flex-col gap-1.5">
                  {(['views', 'likes', 'comments', 'shares'] as const).map(field => (
                    <input key={field} type="number" placeholder={field} value={stats[field] || ''}
                      onChange={e => set({ ...stats, [field]: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 rounded text-[11px] font-mono outline-none"
                      style={{ border: `1px solid ${pCfg.color}22`, background: 'var(--card)', color: 'var(--text)' }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2.5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>Cancel</button>
          <button onClick={() => {
            if (name.trim()) {
              onAdd({
                name: name.trim(), spent: Number(spent) || 0, game: game.trim() || null, start_date: startDate, end_date: endDate || startDate,
                platforms: {
                  tiktok: { ...ttStats, daily: [] },
                  youtube: { ...ytStats, daily: [] },
                  instagram: { ...igStats, daily: [] },
                },
              });
              onClose();
            }
          }} className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
            style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)', opacity: name.trim() && spent ? 1 : 0.4 }}>
            Log Campaign
          </button>
        </div>
      </div>
    </div>
  );
}
