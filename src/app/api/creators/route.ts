import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all creators with their campaigns and platform stats
export async function GET() {
  const { data: creators, error } = await supabase
    .from('creators')
    .select(`
      *,
      campaigns (
        *,
        campaign_platforms (
          *,
          daily_views (*)
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(creators);
}

// POST create a new creator
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, tiktok_url, youtube_url, instagram_url, avatar_url, display_name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  // Extract usernames from URLs
  const tiktok_username = extractUsername(tiktok_url, 'tiktok');
  const youtube_username = extractUsername(youtube_url, 'youtube');
  const instagram_username = extractUsername(instagram_url, 'instagram');

  const { data, error } = await supabase
    .from('creators')
    .insert({
      name: name.trim(),
      tiktok_url, tiktok_username,
      youtube_url, youtube_username,
      instagram_url, instagram_username,
      avatar_url, display_name,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE a creator
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('creators').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

function extractUsername(url: string | null, platform: string): string | null {
  if (!url) return null;
  const clean = url.trim().replace(/\/+$/, '');
  try {
    if (platform === 'tiktok') {
      const m = clean.match(/@([a-zA-Z0-9_.]{2,24})/);
      return m ? m[1] : null;
    }
    if (platform === 'youtube') {
      const at = clean.match(/youtube\.com\/@([a-zA-Z0-9_-]{2,30})/);
      if (at) return at[1];
      const c = clean.match(/youtube\.com\/c\/([a-zA-Z0-9_-]{2,30})/);
      return c ? c[1] : null;
    }
    if (platform === 'instagram') {
      const m = clean.match(/instagram\.com\/([a-zA-Z0-9_.]{1,30})/);
      if (m && !['p', 'reel', 'stories', 'explore'].includes(m[1])) return m[1];
    }
  } catch {}
  return null;
}
