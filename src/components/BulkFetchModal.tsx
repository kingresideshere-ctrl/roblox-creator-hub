'use client';
import { useState } from 'react';
import { PLATFORM_CONFIG, PlatformKey } from '@/lib/types';
import { formatNum } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onApply: (totals: Record<string, { views: number; likes: number; comments: number; shares: number }>) => void;
}

function detectPlatform(url: string): PlatformKey | null {
  const u = url.toLowerCase();
  if (u.includes('tiktok.com') || u.includes('vm.tiktok.com')) return 'tiktok';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('instagram.com')) return 'instagram';
  return null;
}

export default function BulkFetchModal({ onClose, onApply }: Props) {
  const [urlText, setUrlText] = useState('');
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [totals, setTotals] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');

  const parsedUrls = urlText.split('\n').map(l => l.trim()).filter(l => l.length > 10 && (l.startsWith('http') || l.includes('.com/')));

  const handleFetch = async () => {
    if (parsedUrls.length === 0) return;
    setFetching(true);
    setError('');
    setResults(null);

    const urls = parsedUrls.map(url => ({
      url: url.startsWith('http') ? url : `https://${url}`,
      platform: detectPlatform(url) || 'tiktok',
    }));

    try {
      const res = await fetch('/api/fetch-stats-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      setResults(data.results);
      setTotals(data.totals);
    } catch {
      setError('Failed to fetch stats. Try again.');
    }
    setFetching(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-[18px] p-8 w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>⚡ Bulk Fetch Stats</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
          Paste up to 10 video/post URLs (one per line). Platform is auto-detected from the URL.
        </p>

        {/* URL Input */}
        {!results && (
          <>
            <textarea
              value={urlText}
              onChange={e => setUrlText(e.target.value)}
              placeholder={"https://www.tiktok.com/@creator/video/123...\nhttps://www.youtube.com/watch?v=abc...\nhttps://www.instagram.com/reel/xyz..."}
              rows={8}
              className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-none mb-3"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', lineHeight: 1.8 }}
            />

            {/* Preview detected URLs */}
            {parsedUrls.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {parsedUrls.map((url, i) => {
                  const plat = detectPlatform(url);
                  const cfg = plat ? PLATFORM_CONFIG[plat] : null;
                  return (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono"
                      style={{ background: cfg?.bg || 'var(--surface)', color: cfg?.color || 'var(--muted)', border: `1px solid ${cfg?.color || 'var(--border)'}22` }}>
                      {cfg?.icon || '?'} {url.substring(0, 40)}...
                    </span>
                  );
                })}
                <span className="text-[10px] self-center" style={{ color: 'var(--muted)' }}>{parsedUrls.length} URL{parsedUrls.length > 1 ? 's' : ''} detected</span>
              </div>
            )}

            {error && <div className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,82,82,0.08)', color: '#ff5252' }}>{error}</div>}

            <div className="flex gap-2.5">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>Cancel</button>
              <button onClick={handleFetch} disabled={fetching || parsedUrls.length === 0}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
                style={{ background: fetching ? 'var(--muted)' : 'linear-gradient(135deg, #ff2d55, #c837ab)', opacity: parsedUrls.length === 0 ? 0.4 : 1 }}>
                {fetching ? 'Fetching all...' : `Fetch ${parsedUrls.length} URL${parsedUrls.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}

        {/* Results */}
        {results && (
          <>
            <div className="mb-4">
              {results.map((r, i) => {
                const cfg = PLATFORM_CONFIG[r.platform as PlatformKey];
                return (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg mb-1.5"
                    style={{ background: r.success ? cfg?.bg || 'var(--surface)' : 'rgba(255,82,82,0.05)' }}>
                    <span className="text-[10px] font-bold" style={{ color: r.success ? cfg?.color : '#ff5252' }}>
                      {r.success ? '✓' : '✗'}
                    </span>
                    <span className="flex-1 text-[11px] font-mono truncate" style={{ color: 'var(--text-secondary)' }}>
                      {r.url.substring(0, 50)}...
                    </span>
                    {r.success && (
                      <span className="text-[11px] font-bold font-mono" style={{ color: cfg?.color }}>
                        {formatNum(r.views)} views
                      </span>
                    )}
                    {!r.success && (
                      <span className="text-[10px]" style={{ color: '#ff5252' }}>no stats found</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            {totals && (
              <div className="p-4 rounded-xl mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-[10px] font-bold tracking-wide uppercase mb-3" style={{ color: 'var(--muted)' }}>TOTALS TO ADD</div>
                <div className="flex gap-4">
                  {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([p, cfg]) => {
                    const t = totals[p];
                    if (!t || (!t.views && !t.likes)) return null;
                    return (
                      <div key={p} className="flex-1 p-3 rounded-lg" style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}>
                        <div className="text-[10px] font-bold mb-1" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</div>
                        <div className="text-lg font-extrabold" style={{ color: 'var(--text)' }}>{formatNum(t.views)}</div>
                        <div className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>{formatNum(t.likes)} likes</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => { setResults(null); setTotals(null); }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>Back</button>
              <button onClick={() => { if (totals) onApply(totals); onClose(); }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white"
                style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>
                Apply Stats to Campaign
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
