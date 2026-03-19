'use client';
import { useState, useEffect, useMemo } from 'react';
import CreatorAvatar from '@/components/CreatorAvatar';
import AddCreatorModal from '@/components/AddCreatorModal';
import AddCampaignModal from '@/components/AddCampaignModal';
import EditCampaignModal from '@/components/EditCampaignModal';
import CompareModal from '@/components/CompareModal';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { Creator, Campaign, PLATFORM_CONFIG, PlatformKey } from '@/lib/types';
import { formatNum, formatMoney, getCreatorStats, getCampaignStats, getRoiTier, getPlatformUsername, getPlatformLink } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Date filter presets ---
type DatePreset = 'all' | '7d' | '30d' | '90d' | 'custom';
function getDateRange(preset: DatePreset, customStart?: string, customEnd?: string): { start: string | null; end: string | null } {
  if (preset === 'all') return { start: null, end: null };
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  if (preset === 'custom') return { start: customStart || null, end: customEnd || end };
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const start = new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
  return { start, end };
}

function campaignInRange(c: Campaign, start: string | null, end: string | null): boolean {
  if (!start && !end) return true;
  const cStart = c.start_date || c.end_date || '';
  const cEnd = c.end_date || c.start_date || '';
  if (!cStart && !cEnd) return true;
  if (start && cEnd < start) return false;
  if (end && cStart > end) return false;
  return true;
}

// --- CSV Export ---
function exportCSV(creators: Creator[], dateStart: string | null, dateEnd: string | null) {
  const rows: string[][] = [['Creator', 'Campaign', 'Spent', 'Start', 'End', 'Platform', 'Views', 'Likes', 'Comments', 'Shares', 'CPM', 'ROI Tier']];
  creators.forEach(c => {
    c.campaigns.forEach(camp => {
      if (!campaignInRange(camp, dateStart, dateEnd)) return;
      const campStats = getCampaignStats(camp);
      camp.campaign_platforms?.forEach(cp => {
        const tier = getRoiTier(campStats.cpv).tier;
        rows.push([
          c.name, camp.name, String(camp.spent), camp.start_date || '', camp.end_date || '',
          cp.platform, String(cp.views), String(cp.likes), String(cp.comments), String(cp.shares),
          campStats.cpv.toFixed(2), tier
        ]);
      });
      if (!camp.campaign_platforms?.length) {
        rows.push([c.name, camp.name, String(camp.spent), camp.start_date || '', camp.end_date || '', '', '0', '0', '0', '0', '0', '']);
      }
    });
  });
  const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creator-hub-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Mini Bar Chart ---
function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-12">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-[3px]">
          <div style={{ width: 18, height: Math.max(4, (v / max) * 42), background: color, borderRadius: 3, opacity: 0.85, transition: 'height 0.4s cubic-bezier(.4,0,.2,1)' }} />
          <span className="text-[9px] font-mono" style={{ color: 'var(--muted)' }}>{DAYS[i] || ''}</span>
        </div>
      ))}
    </div>
  );
}

// --- Stacked Area Chart ---
function StackedChart({ campaign }: { campaign: Campaign }) {
  const platforms: PlatformKey[] = ['tiktok', 'youtube', 'instagram'];
  const maxDays = 7;
  const getDailyData = (platform: PlatformKey): number[] => {
    const cp = campaign.campaign_platforms?.find(p => p.platform === platform);
    if (!cp?.daily_views?.length) return new Array(maxDays).fill(0);
    const sorted = [...cp.daily_views].sort((a, b) => a.date.localeCompare(b.date));
    const vals = sorted.map(d => d.views);
    while (vals.length < maxDays) vals.push(0);
    return vals.slice(0, maxDays);
  };
  const allDaily = Object.fromEntries(platforms.map(p => [p, getDailyData(p)]));
  const totals = Array.from({ length: maxDays }, (_, i) => platforms.reduce((sum, p) => sum + allDaily[p][i], 0));
  const maxTotal = Math.max(...totals, 1);
  const W = 520, H = 160, PAD = 30, chartW = W - PAD * 2, chartH = H - PAD - 10;
  const getPoints = (platIdx: number) => Array.from({ length: maxDays }, (_, i) => {
    const x = PAD + (i / Math.max(maxDays - 1, 1)) * chartW;
    let stack = 0;
    for (let p = 0; p <= platIdx; p++) stack += allDaily[platforms[p]][i];
    return `${x},${H - PAD - (stack / maxTotal) * chartH}`;
  });
  const getBase = (platIdx: number) => Array.from({ length: maxDays }, (_, i) => {
    const x = PAD + (i / Math.max(maxDays - 1, 1)) * chartW;
    let stack = 0;
    for (let p = 0; p < platIdx; p++) stack += allDaily[platforms[p]][i];
    return `${x},${H - PAD - (stack / maxTotal) * chartH}`;
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[520px]">
      {[0.25, 0.5, 0.75, 1].map(f => (
        <g key={f}>
          <line x1={PAD} x2={W - PAD} y1={H - PAD - f * chartH} y2={H - PAD - f * chartH} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3,3" />
          <text x={PAD - 4} y={H - PAD - f * chartH + 3} textAnchor="end" className="text-[9px] font-mono" fill="var(--muted)">{formatNum(Math.round(maxTotal * f))}</text>
        </g>
      ))}
      {DAYS.map((d, i) => <text key={d} x={PAD + (i / Math.max(maxDays - 1, 1)) * chartW} y={H - 6} textAnchor="middle" className="text-[9px] font-mono" fill="var(--muted)">{d}</text>)}
      {[...platforms].reverse().map(p => {
        const platIdx = platforms.indexOf(p);
        const top = getPoints(platIdx);
        const base = getBase(platIdx);
        return <path key={p} d={`M${top.join(' L')} L${[...base].reverse().join(' L')} Z`} fill={PLATFORM_CONFIG[p].color} opacity={0.25} />;
      })}
      {platforms.map((p, i) => <polyline key={p} points={getPoints(i).join(' ')} fill="none" stroke={PLATFORM_CONFIG[p].color} strokeWidth={2} />)}
    </svg>
  );
}

// --- ROI Badge ---
function ROIBadge({ cpv }: { cpv: number }) {
  const { tier, color, bg } = getRoiTier(cpv);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider font-mono" style={{ background: bg, border: `1px solid ${color}22`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />{tier}
    </span>
  );
}

// ============================================
// MAIN DASHBOARD
// ============================================
function DashboardInner() {
  const { user, signOut } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'creator'>('overview');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'all' | PlatformKey>('all');
  const [showAddCreator, setShowAddCreator] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [showEditCampaign, setShowEditCampaign] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Date filters
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const dateRange = useMemo(() => getDateRange(datePreset, customDateStart, customDateEnd), [datePreset, customDateStart, customDateEnd]);

  const fetchCreators = async () => {
    try {
      const res = await fetch('/api/creators');
      if (res.ok) setCreators(await res.json());
    } catch (e) { console.error('Failed to fetch:', e); }
    setLoading(false);
  };
  useEffect(() => { fetchCreators(); }, []);

  // Filter campaigns by date range
  const filteredCreators = useMemo(() => {
    if (!dateRange.start && !dateRange.end) return creators;
    return creators.map(c => ({
      ...c,
      campaigns: c.campaigns.filter(camp => campaignInRange(camp, dateRange.start, dateRange.end))
    }));
  }, [creators, dateRange]);

  const leaderboard = useMemo(() => {
    return filteredCreators.map(c => ({ ...c, stats: getCreatorStats(c) })).sort((a, b) => a.stats.cpv - b.stats.cpv);
  }, [filteredCreators]);

  const globalStats = useMemo(() => {
    let views = 0, spent = 0;
    const platViews: Record<string, number> = { tiktok: 0, youtube: 0, instagram: 0 };
    filteredCreators.forEach(c => {
      const s = getCreatorStats(c);
      views += s.totalViews; spent += s.totalSpent;
      Object.entries(s.platViews).forEach(([p, v]) => { platViews[p] += v; });
    });
    return { views, spent, cpv: views > 0 ? (spent / views) * 1000 : 0, platViews };
  }, [filteredCreators]);

  const activeCreator = selectedCreatorId ? filteredCreators.find(c => c.id === selectedCreatorId) || creators.find(c => c.id === selectedCreatorId) : null;
  const activeCampaign = activeCreator ? (selectedCampaignId ? activeCreator.campaigns.find(c => c.id === selectedCampaignId) : activeCreator.campaigns[0]) || null : null;

  // --- Handlers ---
  const handleAddCreator = async (data: any) => {
    try { const res = await fetch('/api/creators', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (res.ok) fetchCreators(); } catch (e) { console.error(e); }
  };
  const handleAddCampaign = async (data: any) => {
    if (!activeCreator) return;
    try { const res = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, creator_id: activeCreator.id }) }); if (res.ok) fetchCreators(); } catch (e) { console.error(e); }
  };
  const handleEditCampaign = async (data: any) => {
    try { const res = await fetch('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (res.ok) fetchCreators(); } catch (e) { console.error(e); }
  };
  const handleDeleteCampaign = async (id: string) => {
    try { await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' }); setSelectedCampaignId(null); fetchCreators(); } catch (e) { console.error(e); }
  };
  const handleDeleteCreator = async (id: string) => {
    if (!confirm('Delete this creator and all their campaigns?')) return;
    try { await fetch(`/api/creators?id=${id}`, { method: 'DELETE' }); fetchCreators(); if (selectedCreatorId === id) { setView('overview'); setSelectedCreatorId(null); } } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="px-7 py-5 flex items-center justify-between sticky top-0 z-50" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, #12121a 0%, transparent 100%)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-lg font-extrabold text-white" style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>R</div>
          <div>
            <div className="text-base font-bold tracking-tight">Roblox Creator Hub</div>
            <div className="text-[11px] font-mono" style={{ color: 'var(--muted)' }}>Campaign Analytics Dashboard</div>
          </div>
        </div>
        <div className="flex gap-2.5">
          {view === 'creator' && (
            <button onClick={() => { setView('overview'); setSelectedCreatorId(null); setSelectedCampaignId(null); }} className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}>← Overview</button>
          )}
          <button onClick={() => setShowAddCreator(true)} className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer border-none text-white" style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>+ Add Creator</button>
          <div className="flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
            <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>{user?.name || 'Team'}</span>
            <button onClick={signOut} className="px-3 py-1.5 rounded-md text-[10px] font-semibold cursor-pointer" style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)' }}>Sign Out</button>
          </div>
        </div>
      </header>

      <div className="px-7 py-6 max-w-[1280px] mx-auto">

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin-slow w-8 h-8 rounded-full" style={{ border: '3px solid var(--border)', borderTopColor: 'var(--accent)' }} />
          </div>
        )}

        {!loading && creators.length === 0 && view === 'overview' && (
          <div className="animate-fade-up text-center py-24 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-5xl mb-4">🎮</div>
            <div className="text-xl font-bold mb-2">No creators yet</div>
            <div className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Add your first Roblox content creator to start tracking</div>
            <button onClick={() => setShowAddCreator(true)} className="px-6 py-3 rounded-lg text-sm font-bold cursor-pointer border-none text-white" style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>+ Add Your First Creator</button>
          </div>
        )}

        {/* === OVERVIEW === */}
        {!loading && creators.length > 0 && view === 'overview' && (
          <>
            {/* Date Filter Bar + Export */}
            <div className="flex items-center justify-between mb-5 animate-fade-up">
              <div className="flex gap-1.5">
                {([['all', 'All Time'], ['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days'], ['custom', 'Custom']] as [DatePreset, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setDatePreset(key)} className="px-3 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer" style={{
                    border: datePreset === key ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: datePreset === key ? 'rgba(255,45,85,0.1)' : 'transparent',
                    color: datePreset === key ? 'var(--accent)' : 'var(--muted)',
                  }}>{label}</button>
                ))}
                {datePreset === 'custom' && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <input type="date" value={customDateStart} onChange={e => setCustomDateStart(e.target.value)} className="px-2 py-1 rounded text-[11px] font-mono outline-none" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>→</span>
                    <input type="date" value={customDateEnd} onChange={e => setCustomDateEnd(e.target.value)} className="px-2 py-1 rounded text-[11px] font-mono outline-none" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }} />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCompare(true)} className="px-4 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer" style={{ border: '1px solid var(--accent)', background: 'rgba(255,45,85,0.05)', color: 'var(--accent)' }}>
                  ⚖️ Compare
                </button>
                <button onClick={() => exportCSV(filteredCreators, dateRange.start, dateRange.end)} className="px-4 py-1.5 rounded-md text-[11px] font-semibold cursor-pointer" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                  ↓ Export CSV
                </button>
              </div>
            </div>

            {/* Global Stats */}
            <div className="grid grid-cols-4 gap-3.5 mb-7">
              {[
                { label: 'TOTAL VIEWS', value: formatNum(globalStats.views), sub: datePreset === 'all' ? 'all time' : `last ${datePreset === 'custom' ? 'range' : datePreset}` },
                { label: 'TOTAL SPENT', value: formatMoney(globalStats.spent), sub: 'all creators' },
                { label: 'AVG CPM', value: '$' + globalStats.cpv.toFixed(2), sub: 'cost per 1K views' },
                { label: 'CREATORS', value: creators.length.toString(), sub: 'in roster' },
              ].map((s, i) => (
                <div key={i} className="animate-fade-up rounded-[14px] p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: `${i * 0.06}s` }}>
                  <div className="text-[10px] font-bold tracking-[1.5px] font-mono mb-2" style={{ color: 'var(--muted)' }}>{s.label}</div>
                  <div className="text-[28px] font-extrabold tracking-tight leading-none">{s.value}</div>
                  <div className="text-[11px] mt-1.5" style={{ color: 'var(--muted)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Platform Split */}
            <div className="animate-fade-up rounded-[14px] p-5 mb-7" style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: '0.25s' }}>
              <div className="text-[10px] font-bold tracking-[1.5px] font-mono mb-4" style={{ color: 'var(--muted)' }}>VIEWS BY PLATFORM</div>
              <div className="flex gap-4">
                {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, typeof PLATFORM_CONFIG[PlatformKey]][]).map(([key, cfg]) => {
                  const pct = globalStats.views > 0 ? (globalStats.platViews[key] / globalStats.views * 100) : 0;
                  return (
                    <div key={key} className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</span>
                        <span className="text-xl font-extrabold">{formatNum(globalStats.platViews[key])}</span>
                      </div>
                      <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: 'var(--surface)' }}>
                        <div className="h-full rounded-sm transition-all duration-700" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--muted)' }}>{pct.toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-bold tracking-[1.5px] font-mono" style={{ color: 'var(--muted)' }}>CREATOR LEADERBOARD — RANKED BY ROI</div>
                <div className="flex gap-1.5">
                  {[{ key: 'all' as const, label: 'All' }, ...Object.entries(PLATFORM_CONFIG).map(([k, v]) => ({ key: k as PlatformKey, label: v.label }))].map(f => (
                    <button key={f.key} onClick={() => setPlatformFilter(f.key)} className="px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer" style={{
                      border: platformFilter === f.key ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: platformFilter === f.key ? 'rgba(255,45,85,0.1)' : 'transparent',
                      color: platformFilter === f.key ? 'var(--accent)' : 'var(--muted)',
                    }}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {leaderboard.map((c, i) => {
                  const views = platformFilter === 'all' ? c.stats.totalViews : (c.stats.platViews[platformFilter] || 0);
                  const cpv = views > 0 ? (c.stats.totalSpent / views) * 1000 : 0;
                  return (
                    <div key={c.id} onClick={() => { setSelectedCreatorId(c.id); setSelectedCampaignId(null); setView('creator'); }}
                      className="animate-fade-up rounded-xl px-5 py-4 flex items-center gap-3.5 cursor-pointer transition-all"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: `${0.35 + i * 0.06}s` }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}>
                      <div className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] font-bold font-mono" style={{ background: 'var(--surface)', color: 'var(--muted)' }}>{i + 1}</div>
                      <CreatorAvatar name={c.name} size={38} imageUrl={c.avatar_url} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold mb-1">{c.name}</div>
                        <div className="flex flex-wrap gap-1">
                          {(Object.keys(PLATFORM_CONFIG) as PlatformKey[]).map(p => {
                            const username = getPlatformUsername(c, p);
                            if (!username) return null;
                            const cfg = PLATFORM_CONFIG[p];
                            return <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold font-mono" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} @{username}</span>;
                          })}
                        </div>
                      </div>
                      <div className="flex gap-5 items-center">
                        {platformFilter === 'all' && (Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([p, cfg]) => (
                          <div key={p} className="text-right">
                            <div className="text-[10px] font-semibold mb-0.5" style={{ color: cfg.color }}>{cfg.icon} {cfg.label}</div>
                            <div className="text-sm font-bold font-mono">{formatNum(c.stats.platViews[p])}</div>
                          </div>
                        ))}
                        <div className="text-right min-w-[65px]">
                          <div className="text-[10px] font-semibold mb-0.5" style={{ color: 'var(--muted)' }}>SPENT</div>
                          <div className="text-sm font-bold font-mono">{formatMoney(c.stats.totalSpent)}</div>
                        </div>
                        <div className="text-right min-w-[55px]">
                          <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--muted)' }}>CPM</div>
                          <div className="text-[13px] font-bold font-mono">${cpv.toFixed(2)}</div>
                        </div>
                        <ROIBadge cpv={cpv} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* === CREATOR DETAIL === */}
        {view === 'creator' && activeCreator && (
          <>
            {/* Profile */}
            <div className="animate-fade-up rounded-2xl p-6 mb-6 flex items-center gap-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <CreatorAvatar name={activeCreator.name} size={64} imageUrl={activeCreator.avatar_url} />
              <div className="flex-1">
                <div className="text-[26px] font-extrabold tracking-tight mb-2">{activeCreator.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PLATFORM_CONFIG) as PlatformKey[]).map(p => {
                    const username = getPlatformUsername(activeCreator, p);
                    const link = getPlatformLink(activeCreator, p);
                    if (!username && !link) return null;
                    const cfg = PLATFORM_CONFIG[p];
                    return <a key={p} href={link || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[7px] text-xs font-semibold font-mono no-underline" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}22` }}>{cfg.icon} {username ? `@${username}` : 'linked ✓'} <span className="text-[9px] opacity-60">↗</span></a>;
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddCampaign(true)} className="px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}>+ Log Campaign</button>
                <button onClick={() => handleDeleteCreator(activeCreator.id)} className="px-3 py-2.5 rounded-lg text-xs cursor-pointer" style={{ border: '1px solid rgba(255,82,82,0.2)', background: 'rgba(255,82,82,0.05)', color: '#ff5252' }}>✕</button>
              </div>
            </div>

            {/* Campaign Tabs with Edit */}
            {activeCreator.campaigns.length > 0 && (
              <div className="flex gap-2 mb-5 flex-wrap items-center">
                {activeCreator.campaigns.map(camp => {
                  const isActive = (selectedCampaignId || activeCreator.campaigns[0]?.id) === camp.id;
                  return (
                    <button key={camp.id} onClick={() => setSelectedCampaignId(camp.id)} className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer" style={{
                      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isActive ? 'rgba(255,45,85,0.1)' : 'var(--card)',
                      color: isActive ? 'var(--accent)' : 'var(--muted)',
                    }}>{camp.name}</button>
                  );
                })}
                {activeCampaign && (
                  <button onClick={() => setShowEditCampaign(true)} className="px-3 py-2 rounded-lg text-[11px] font-semibold cursor-pointer" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                    ✏️ Edit Campaign
                  </button>
                )}
              </div>
            )}

            {activeCreator.campaigns.length === 0 && (
              <div className="animate-fade-up text-center py-12 rounded-[14px]" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-3">📊</div>
                <div className="text-base font-semibold mb-1.5">No campaigns yet</div>
                <div className="text-[13px] mb-5" style={{ color: 'var(--muted)' }}>Log your first campaign to start tracking</div>
                <button onClick={() => setShowAddCampaign(true)} className="px-6 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer border-none text-white" style={{ background: 'linear-gradient(135deg, #ff2d55, #c837ab)' }}>+ Log First Campaign</button>
              </div>
            )}

            {activeCampaign && (() => {
              const campStats = getCampaignStats(activeCampaign);
              return (
                <>
                  <div className="grid grid-cols-3 gap-3.5 mb-5">
                    {[
                      { label: 'AMOUNT SPENT', value: formatMoney(Number(activeCampaign.spent)), accent: true },
                      { label: 'TOTAL VIEWS', value: formatNum(campStats.totalViews) },
                      { label: 'COST PER 1K VIEWS', value: '$' + campStats.cpv.toFixed(2) },
                    ].map((s, i) => (
                      <div key={i} className="animate-fade-up rounded-[14px] p-[18px]" style={{
                        background: s.accent ? 'linear-gradient(135deg, rgba(255,45,85,0.08), rgba(200,55,171,0.08))' : 'var(--card)',
                        border: s.accent ? '1px solid rgba(255,45,85,0.2)' : '1px solid var(--border)', animationDelay: `${i * 0.06}s`,
                      }}>
                        <div className="text-[10px] font-bold tracking-[1.5px] font-mono mb-2" style={{ color: 'var(--muted)' }}>{s.label}</div>
                        <div className="text-2xl font-extrabold tracking-tight">{s.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="animate-fade-up rounded-[14px] p-5 mb-5" style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: '0.2s' }}>
                    <div className="text-[10px] font-bold tracking-[1.5px] font-mono mb-3.5" style={{ color: 'var(--muted)' }}>7-DAY VIEW BREAKDOWN</div>
                    <StackedChart campaign={activeCampaign} />
                    <div className="flex gap-4 mt-2.5">
                      {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([k, v]) => (
                        <span key={k} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--muted)' }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: v.color }} />{v.label}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3.5">
                    {(Object.entries(PLATFORM_CONFIG) as [PlatformKey, any][]).map(([pKey, pCfg], i) => {
                      const cp = activeCampaign.campaign_platforms?.find(p => p.platform === pKey);
                      const dailyData = cp?.daily_views ? [...cp.daily_views].sort((a, b) => a.date.localeCompare(b.date)).map(d => d.views) : [];
                      while (dailyData.length < 7) dailyData.push(0);
                      return (
                        <div key={pKey} className="animate-fade-up rounded-[14px] p-[18px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: `${0.3 + i * 0.08}s` }}>
                          <div className="flex items-center justify-between mb-3.5">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ color: pCfg.color, background: pCfg.bg }}>{pCfg.icon} {pCfg.label}</span>
                            {getPlatformUsername(activeCreator, pKey) && <span className="text-[10px] font-mono" style={{ color: 'var(--muted)' }}>@{getPlatformUsername(activeCreator, pKey)}</span>}
                          </div>
                          <div className="grid grid-cols-2 gap-x-5 gap-y-3 mb-4">
                            {[{ label: 'Views', val: formatNum(cp?.views || 0) }, { label: 'Likes', val: formatNum(cp?.likes || 0) }, { label: 'Comments', val: formatNum(cp?.comments || 0) }, { label: 'Shares', val: formatNum(cp?.shares || 0) }].map(d => (
                              <div key={d.label}><div className="text-[10px] font-semibold font-mono mb-0.5" style={{ color: 'var(--muted)' }}>{d.label}</div><div className="text-lg font-extrabold">{d.val}</div></div>
                            ))}
                          </div>
                          <MiniChart data={dailyData.slice(0, 7)} color={pCfg.color} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Verdict */}
                  <div className="animate-fade-up rounded-[14px] p-5 mt-5" style={{ background: 'var(--card)', border: '1px solid var(--border)', animationDelay: '0.5s' }}>
                    <div className="text-[10px] font-bold tracking-[1.5px] font-mono mb-3" style={{ color: 'var(--muted)' }}>VERDICT — IS {activeCreator.name.toUpperCase()} WORTH REBOOKING?</div>
                    {(() => {
                      const bestPlat = activeCampaign.campaign_platforms?.slice().sort((a, b) => b.views - a.views)[0];
                      return (
                        <div className="flex items-center gap-5">
                          <ROIBadge cpv={campStats.cpv} />
                          <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {formatMoney(Number(activeCampaign.spent))} spent → {formatNum(campStats.totalViews)} total views = <strong style={{ color: 'var(--text)' }}>${campStats.cpv.toFixed(2)} CPM</strong>.
                            {bestPlat && <> Best platform: <strong style={{ color: PLATFORM_CONFIG[bestPlat.platform as PlatformKey]?.color }}>{PLATFORM_CONFIG[bestPlat.platform as PlatformKey]?.label}</strong> with {formatNum(bestPlat.views)} views.</>}
                            {campStats.cpv <= 1 ? ' Strong ROI — rebook recommended.' : campStats.cpv <= 2 ? ' Decent — consider renegotiating rate.' : ' High cost per view — explore alternatives.'}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddCreator && <AddCreatorModal onClose={() => setShowAddCreator(false)} onAdd={handleAddCreator} />}
      {showAddCampaign && activeCreator && <AddCampaignModal creator={activeCreator} onClose={() => setShowAddCampaign(false)} onAdd={handleAddCampaign} />}
      {showEditCampaign && activeCreator && activeCampaign && (
        <EditCampaignModal
          creator={activeCreator}
          campaign={activeCampaign}
          onClose={() => setShowEditCampaign(false)}
          onSave={handleEditCampaign}
          onDelete={(id) => { handleDeleteCampaign(id); setShowEditCampaign(false); }}
        />
      )}
      {showCompare && <CompareModal creators={creators} onClose={() => setShowCompare(false)} />}
    </div>
  );
}

// Wrap with auth guard
export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}
