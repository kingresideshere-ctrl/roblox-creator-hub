export interface DailyView {
  id: string;
  campaign_platform_id: string;
  date: string;
  views: number;
}

export interface CampaignPlatform {
  id: string;
  campaign_id: string;
  platform: 'tiktok' | 'youtube' | 'instagram';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  daily_views: DailyView[];
}

export interface Campaign {
  id: string;
  creator_id: string;
  name: string;
  spent: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  campaign_platforms: CampaignPlatform[];
}

export interface Creator {
  id: string;
  name: string;
  avatar_url: string | null;
  display_name: string | null;
  tiktok_url: string | null;
  tiktok_username: string | null;
  youtube_url: string | null;
  youtube_username: string | null;
  instagram_url: string | null;
  instagram_username: string | null;
  campaigns: Campaign[];
}

export const PLATFORM_CONFIG = {
  tiktok: { label: 'TikTok', color: '#ff2d55', bg: 'rgba(255,45,85,0.08)', icon: '▶' },
  youtube: { label: 'YouTube', color: '#ff4444', bg: 'rgba(255,68,68,0.08)', icon: '►' },
  instagram: { label: 'Instagram', color: '#c837ab', bg: 'rgba(200,55,171,0.08)', icon: '◉' },
} as const;

export type PlatformKey = keyof typeof PLATFORM_CONFIG;
