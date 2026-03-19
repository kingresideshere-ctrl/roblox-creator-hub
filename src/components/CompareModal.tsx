'use client';
import { useState } from 'react';
import CreatorAvatar from './CreatorAvatar';
import { Creator, PLATFORM_CONFIG, PlatformKey } from '@/lib/types';
import { formatNum, formatMoney, getCreatorStats, getRoiTier } from '@/lib/utils';

interface Props {
  creators: Creator[];
  onClose: () => void;
}

export default function CompareModal({ creators, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compared = selected.map(id => {
    const c = creators.find(cr => cr.id === id)!;
    return { ...c, stats: getCreatorStats(c) };
  });

  // Find best in each category for highlighting
  const bestViews = compared.length > 1 ? compared.reduce((a, b) => a.stats.totalViews > b.stats.totalViews ? a : b).id : null;
  const bestCPM = compared.length > 1 ? compared.reduce((a, b) => (a.stats.cpv > 0 ? a.stats.cpv : 999) < (b.stats.cpv > 0 ? b.stats.cpv : 999) ? a : b).id : null;
  const bestROI = bestCPM;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="rounded-[18px] p-8 w-[720px] max-w-[95vw] max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border-light)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>

        <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>⚖️ Compare Creators</h3>
        <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
          Select 2-3 creators to compare side-by-side ({selected.length}/3 selected)
        </p>

        {/* Creator Selection */}
        <div className="flex flex-wrap gap-2 mb-6">
          {creators.map(c => {
            const isSelected = selected.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggle(c.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                style={{
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(255,45,85,0.1)' : 'var(--surface)',
                  color: isSelected ? 'var(--accent)' : 'var(--muted)',
                  opacity: !isSelected && selected.length >= 3 ? 0.4 : 1,
                }}>
                <CreatorAvatar name={c.name} size={22} imageUrl={c.avatar_url} />
                {c.name}
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>

        {/* Comparison Table */}
        {compared.length >= 2 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {/* Header Row */}
            <div className="grid gap-0" style={{ gridTemplateColumns: `160px repeat(${compared.length}, 1fr)` }}>
              <div className="p-3" style={{ background: 'var(--surface)' }}></div>
              {compared.map(c => (
                <div key={c.id} className="p-4 text-center" style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}>
                  <CreatorAvatar name={c.name} size={40} imageUrl={c.avatar_url} />
                  <div className="text-sm font-bold mt-2">{c.name}</div>
                  <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--muted)' }}>
                    {c.campaigns.length} campaign{c.campaigns.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Stat Rows */}
            {[
              {
                label: 'Total Views', key: 'totalViews',
                render: (c: any) => formatNum(c.stats.totalViews),
                best: bestViews,
              },
              {
                label: 'Total Spent', key: 'totalSpent',
                render: (c: any) => formatMoney(c.stats.totalSpent),
                best: null,
              },
              {
                label: 'CPM (Cost/1K)', key: 'cpv',
                render: (c: any) => '$' + c.stats.cpv.toFixed(2),
                best: bestCPM,
              },
              {
                label: 'ROI Rating', key: 'roi',
                render: (c: any) => {
                  const { tier, color } = getRoiTier(c.stats.cpv);
                  return <span style={{ color, fontWeight: 700 }}>{tier}</span>;
                },
                best: bestROI,
              },
              ...Object.entries(PLATFORM_CONFIG).map(([p, cfg]) => ({
                label: `${cfg.icon} ${cfg.label}`,
                key: p,
                render: (c: any) => (
                  <span style={{ color: cfg.color, fontWeight: 700 }}>{formatNum(c.stats.platViews[p] || 0)}</span>
                ),
                best: compared.length > 1 ? compared.reduce((a, b) => (a.stats.platViews[p] || 0) > (b.stats.platViews[p] || 0) ? a : b).id : null,
              })),
              {
                label: 'Views per $1',
                key: 'vpd',
                render: (c: any) => {
                  const vpd = c.stats.totalSpent > 0 ? c.stats.totalViews / c.stats.totalSpent : 0;
                  return formatNum(Math.round(vpd));
                },
                best: compared.length > 1 ? compared.reduce((a, b) => {
                  const aVpd = a.stats.totalSpent > 0 ? a.stats.totalViews / a.stats.totalSpent : 0;
                  const bVpd = b.stats.totalSpent > 0 ? b.stats.totalViews / b.stats.totalSpent : 0;
                  return aVpd > bVpd ? a : b;
                }).id : null,
              },
            ].map((row, i) => (
              <div key={row.key} className="grid gap-0" style={{ gridTemplateColumns: `160px repeat(${compared.length}, 1fr)` }}>
                <div className="px-4 py-3 text-[11px] font-semibold flex items-center"
                  style={{ background: i % 2 === 0 ? 'var(--card)' : 'var(--surface)', color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                  {row.label}
                </div>
                {compared.map(c => (
                  <div key={c.id} className="px-4 py-3 text-center text-sm font-mono flex items-center justify-center"
                    style={{
                      background: i % 2 === 0 ? 'var(--card)' : 'var(--surface)',
                      borderTop: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                      outline: row.best === c.id ? '2px solid #00e676' : 'none',
                      outlineOffset: -2,
                    }}>
                    {typeof row.render(c) === 'string' ? (
                      <span style={{ color: row.best === c.id ? '#00e676' : 'var(--text)', fontWeight: row.best === c.id ? 800 : 500 }}>
                        {row.render(c)}
                      </span>
                    ) : row.render(c)}
                    {row.best === c.id && <span className="ml-1.5 text-[9px]" style={{ color: '#00e676' }}>👑</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {compared.length < 2 && selected.length > 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--muted)' }}>
            Select at least 2 creators to compare
          </div>
        )}

        {/* Verdict */}
        {compared.length >= 2 && bestROI && (() => {
          const winner = compared.find(c => c.id === bestROI)!;
          const { tier, color } = getRoiTier(winner.stats.cpv);
          return (
            <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.15)' }}>
              <div className="text-[11px] font-bold tracking-wide uppercase mb-2" style={{ color: '#00e676' }}>
                👑 BEST VALUE
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text)' }}>{winner.name}</strong> delivers the best ROI at <strong style={{ color }}>${winner.stats.cpv.toFixed(2)} CPM</strong> ({tier}).
                {winner.stats.totalSpent > 0 && <> For every $1 spent, you get <strong style={{ color: 'var(--text)' }}>{formatNum(Math.round(winner.stats.totalViews / winner.stats.totalSpent))}</strong> views.</>}
              </div>
            </div>
          );
        })()}

        <div className="flex gap-2.5 mt-6">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
            style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
