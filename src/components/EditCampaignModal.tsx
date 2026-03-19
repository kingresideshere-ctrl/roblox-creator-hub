'use client';
import { useState } from 'react';
import CreatorAvatar from './CreatorAvatar';
import { Creator, Campaign, PLATFORM_CONFIG, PlatformKey } from '@/lib/types';
import { formatNum } from '@/lib/utils';

interface Props {
  creator: Creator;
  campaign: Campaign;
  onClose: () => void;
  onSave: (data: {
    id: string;
    name: string;
    spent: number;
    start_date: string;
    end_date: string;
    platforms: Record<string, { views: number; likes: number; comments: number; shares: number }>;
  }) => void;
  onDelete: (id: string) => void;
}

export default function EditCampaignModal({ creator, campaign, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(campaign.name);
  const [spent, setSpent] = useState(String(campaign.spent || ''));
  const [startDate, setStartDate] = useState(campaign.start_date || '');
  const [endDate, setEndDate] = useState(campaign.end_date || '');

  // Per-platform stats
  const getPlatStats = (p: PlatformKey) => {
    const cp = campaign.campaign_platforms?.find(cp => cp.platform === p);
    return { views: cp?.views || 0, likes: cp?.likes || 0, comments: cp?.comments || 0, shares: cp?.shares || 0 };
  };

  const [ttStats, setTtStats] = useState(getPlatStats('tiktok'));
  const [ytStats, setYtStats] = useState(getPlatStats('youtube'));
  const [igStats, setIgStats] = useState(getPlatStats('instagram'));

  // Auto-fetch URL inputs
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
        setFetchResult(`Added ${formatNum(data.views || 0)} views, ${formatNum(data.likes || 0)} likes${data.title ? ` from "${data.title.substring(0, 40)}..."` : ''}`);
      } else {
        setFetchResult('Could not extract stats from this URL. You can enter numbers manually below.');
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
        className="rounded-[18px] p-8 w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreatorAvatar name={creator.name} size={36} imageUrl={creator.avatar_url} />
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Edit Campaign</h3>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{creator.name}</div>
            </div>
          </div>
          <button onClick={() => { if (confirm('Delete this campaign?')) onDelete(campaign.id); }}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ border: '1px solid rgba(255,82,82,0.3)', background: 'rgba(255,82,82,0.05)', color: '#ff5252' }}>
            Delete
          </button>
        </div>

        {/* Campaign Name */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
            Campaign Name
          </label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono outline-none"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
        </div>

        {/* Spend + Dates */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold tracking-wide uppercase mb-1.5" style={{ color: 'var(--muted)' }}>Spend ($)</label>
            <input value={spent} onChange={e => setSpent(e.target.value)} type="number"
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

        {/* Auto-Fetch Stats */}
        <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] font-semibold tracking-wide uppercase mb-2" style={{ color: 'var(--accent)' }}>
            ⚡ Auto-Fetch Stats from URL
          </div>
          <div className="text-[11px] mb-3" style={{ color: 'var(--muted)' }}>
            Paste a video/post URL and we'll try to pull the view count, likes, and comments automatically
          </div>
          <div className="flex gap-2 mb-2">
            <select value={fetchPlatform} onChange={e => setFetchPlatform(e.target.value as PlatformKey)}
              className="px-2 py-2 rounded-lg text-xs font-semibold outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', minWidth: 100 }}>
              {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
            <input value={fetchUrl} onChange={e => setFetchUrl(e.target.value)}
              placeholder="Paste video/post URL..."
              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)' }}
              onKeyDown={e => { if (e.key === 'Enter') handleAutoFetch(); }}
            />
            <button onClick={handleAutoFetch} disabled={fetching || !fetchUrl.trim()}
              className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border-none text-white"
              style={{ background: fetching ? 'var(--muted)' : 'linear-gradient(135deg, #ff2d55, #c837ab)', opacity: !fetchUrl.trim() ? 0.4 : 1 }}>
              {fetching ? '...' : 'Fetch'}
            </button>
          </div>
          {fetchResult && (
            <div className="text-[11px] px-2 py-1.5 rounded-md mt-1"
              style={{ background: fetchResult.includes('Added') ? 'rgba(0,230,118,0.08)' : 'rgba(255,215,64,0.08)',
                       color: fetchResult.includes('Added') ? '#00e676' : '#ffd740' }}>
              {fetchResult}
            </div>
          )}
        </div>

        {/* Per-Platform Stats */}
        <div className="text-[11px] font-semibold tracking-wide uppercase mb-3" style={{ color: 'var(--muted)' }}>
          Platform Stats (editable)
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([pKey, pCfg]) => {
            const { stats, set } = statsMap[pKey];
            return (
              <div key={pKey} className="p-3 rounded-xl" style={{ background: pCfg.bg, border: `1px solid ${pCfg.color}22` }}>
                <div className="text-xs font-bold mb-2" style={{ color: pCfg.color }}>{pCfg.icon} {pCfg.label}</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['views', 'likes', 'comments', 'shares'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-[9px] font-semibold uppercase mb-1" style={{ color: 'var(--muted)' }}>{field}</label>
                      <input
                        type="number"
                        value={stats[field] || ''}
                        onChange={e => set({ ...stats, [field]: Number(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded text-xs font-mono outline-none"
                        style={{ border: `1px solid ${pCfg.color}33`, background: 'var(--card)', color: 'var(--text)' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>
            Cancel
          </button>
          <button
            onClick={() => {
              onSave({
                id: campaign.id,
                name: name.trim(),
                spent: Number(spent) || 0,
                start_date: startDate,
                end_date: endDate,
                platforms: {
                  tiktok: ttStats,
                  youtube: ytStats,
                  instagram: igStats,
                },
              });
              onClose();
            }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
            style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
