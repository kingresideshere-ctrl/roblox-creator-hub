-- ============================================
-- Roblox Creator Hub — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Creators table
CREATE TABLE creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  display_name TEXT,
  tiktok_url TEXT,
  tiktok_username TEXT,
  youtube_url TEXT,
  youtube_username TEXT,
  instagram_url TEXT,
  instagram_username TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns table
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  spent NUMERIC(10,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Platform stats per campaign (one row per platform per campaign)
CREATE TABLE campaign_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, platform)
);

-- Daily view snapshots for charts
CREATE TABLE daily_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_platform_id UUID REFERENCES campaign_platforms(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  views BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_platform_id, date)
);

-- Enable Row Level Security (public for now — add auth later)
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_views ENABLE ROW LEVEL SECURITY;

-- Public access policies (replace with auth-based policies when you add login)
CREATE POLICY "Public read creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Public insert creators" ON creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update creators" ON creators FOR UPDATE USING (true);
CREATE POLICY "Public delete creators" ON creators FOR DELETE USING (true);

CREATE POLICY "Public read campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Public insert campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update campaigns" ON campaigns FOR UPDATE USING (true);
CREATE POLICY "Public delete campaigns" ON campaigns FOR DELETE USING (true);

CREATE POLICY "Public read campaign_platforms" ON campaign_platforms FOR SELECT USING (true);
CREATE POLICY "Public insert campaign_platforms" ON campaign_platforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update campaign_platforms" ON campaign_platforms FOR UPDATE USING (true);
CREATE POLICY "Public delete campaign_platforms" ON campaign_platforms FOR DELETE USING (true);

CREATE POLICY "Public read daily_views" ON daily_views FOR SELECT USING (true);
CREATE POLICY "Public insert daily_views" ON daily_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update daily_views" ON daily_views FOR UPDATE USING (true);
CREATE POLICY "Public delete daily_views" ON daily_views FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaign_platforms_campaign ON campaign_platforms(campaign_id);
CREATE INDEX idx_daily_views_platform ON daily_views(campaign_platform_id);
CREATE INDEX idx_daily_views_date ON daily_views(date);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creators_updated_at BEFORE UPDATE ON creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER campaign_platforms_updated_at BEFORE UPDATE ON campaign_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
