import { Creator, Campaign, PlatformKey } from './types';

export function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString();
}

export function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function generateGradient(name: string): string {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < name.length; i++) {
    h1 = name.charCodeAt(i) + ((h1 << 5) - h1);
    h2 = name.charCodeAt(i) * 7 + ((h2 << 3) - h2);
  }
  const hue1 = Math.abs(h1 % 360);
  const hue2 = (hue1 + 40 + Math.abs(h2 % 80)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 60%, 45%))`;
}

export function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash % 360)}, 65%, 55%)`;
}

export function getCreatorStats(creator: Creator) {
  let totalViews = 0, totalSpent = 0;
  const platViews: Record<string, number> = { tiktok: 0, youtube: 0, instagram: 0 };

  creator.campaigns.forEach(camp => {
    totalSpent += Number(camp.spent) || 0;
    camp.campaign_platforms?.forEach(cp => {
      totalViews += cp.views;
      platViews[cp.platform] += cp.views;
    });
  });

  const cpv = totalViews > 0 ? (totalSpent / totalViews) * 1000 : 0;
  return { totalViews, totalSpent, cpv, platViews };
}

export function getCampaignStats(campaign: Campaign) {
  let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;
  campaign.campaign_platforms?.forEach(cp => {
    totalViews += cp.views;
    totalLikes += cp.likes;
    totalComments += cp.comments;
    totalShares += cp.shares;
  });
  const cpv = totalViews > 0 ? (Number(campaign.spent) / totalViews) * 1000 : 0;
  return { totalViews, totalLikes, totalComments, totalShares, cpv };
}

export function getRoiTier(cpv: number) {
  if (cpv <= 0.5) return { tier: 'EXCELLENT', color: '#00e676', bg: 'rgba(0,230,118,0.1)' };
  if (cpv <= 1) return { tier: 'GOOD', color: '#69f0ae', bg: 'rgba(105,240,174,0.08)' };
  if (cpv <= 2) return { tier: 'FAIR', color: '#ffd740', bg: 'rgba(255,215,64,0.08)' };
  return { tier: 'POOR', color: '#ff5252', bg: 'rgba(255,82,82,0.08)' };
}

export function getPlatformLink(creator: Creator, platform: PlatformKey): string | null {
  if (platform === 'tiktok') return creator.tiktok_url;
  if (platform === 'youtube') return creator.youtube_url;
  if (platform === 'instagram') return creator.instagram_url;
  return null;
}

export function getPlatformUsername(creator: Creator, platform: PlatformKey): string | null {
  if (platform === 'tiktok') return creator.tiktok_username;
  if (platform === 'youtube') return creator.youtube_username;
  if (platform === 'instagram') return creator.instagram_username;
  return null;
}
