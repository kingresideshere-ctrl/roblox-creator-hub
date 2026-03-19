import { NextRequest, NextResponse } from 'next/server';

// Server-side profile fetcher — no CORS issues here
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  const platform = req.nextUrl.searchParams.get('platform');

  if (!url || !platform) {
    return NextResponse.json({ error: 'Missing url or platform' }, { status: 400 });
  }

  try {
    const result = await fetchProfile(url, platform);
    return NextResponse.json(result || { avatar: null, displayName: null });
  } catch (e) {
    return NextResponse.json({ avatar: null, displayName: null });
  }
}

async function fetchProfile(url: string, platform: string) {
  const clean = url.trim().replace(/\/+$/, '');

  // --- YouTube ---
  if (platform === 'youtube') {
    // Try noembed first
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.author_name) {
          return { displayName: data.author_name, avatar: data.thumbnail_url || null };
        }
      }
    } catch {}

    // Try unavatar.io with extracted username
    const username = extractUsername(clean, 'youtube');
    if (username) {
      const avatarUrl = `https://unavatar.io/youtube/${username}`;
      const test = await fetch(avatarUrl, { method: 'HEAD', redirect: 'follow' });
      if (test.ok && test.headers.get('content-type')?.includes('image')) {
        return { displayName: null, avatar: avatarUrl };
      }
    }
  }

  // --- TikTok ---
  if (platform === 'tiktok') {
    const username = extractUsername(clean, 'tiktok');
    if (username) {
      // Try unavatar
      const avatarUrl = `https://unavatar.io/tiktok/${username}`;
      try {
        const test = await fetch(avatarUrl, { method: 'HEAD', redirect: 'follow' });
        if (test.ok && test.headers.get('content-type')?.includes('image')) {
          return { displayName: null, avatar: avatarUrl };
        }
      } catch {}
    }
  }

  // --- Instagram ---
  if (platform === 'instagram') {
    const username = extractUsername(clean, 'instagram');
    if (username) {
      const avatarUrl = `https://unavatar.io/instagram/${username}`;
      try {
        const test = await fetch(avatarUrl, { method: 'HEAD', redirect: 'follow' });
        if (test.ok && test.headers.get('content-type')?.includes('image')) {
          return { displayName: null, avatar: avatarUrl };
        }
      } catch {}
    }
  }

  // Fallback: generic unavatar
  const username = extractUsername(clean, platform);
  if (username) {
    return { displayName: null, avatar: `https://unavatar.io/${username}` };
  }

  return null;
}

function extractUsername(url: string, platform: string): string | null {
  const clean = url.trim().replace(/\/+$/, '');
  try {
    if (platform === 'tiktok') {
      const m = clean.match(/@([a-zA-Z0-9_.]{2,24})/);
      if (m) return m[1];
    }
    if (platform === 'youtube') {
      const atHandle = clean.match(/youtube\.com\/@([a-zA-Z0-9_-]{2,30})/);
      if (atHandle) return atHandle[1];
      const customUrl = clean.match(/youtube\.com\/c\/([a-zA-Z0-9_-]{2,30})/);
      if (customUrl) return customUrl[1];
    }
    if (platform === 'instagram') {
      const m = clean.match(/instagram\.com\/([a-zA-Z0-9_.]{1,30})/);
      if (m && !['p', 'reel', 'stories', 'explore'].includes(m[1])) return m[1];
    }
  } catch {}
  return null;
}
