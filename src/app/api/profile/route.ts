import { NextRequest, NextResponse } from 'next/server';

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

  if (platform === 'youtube') {
    // Strategy 1: Scrape YouTube page for og:image and title
    try {
      const pageRes = await fetch(clean, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]
          || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/)?.[1];
        const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)?.[1]
          || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/)?.[1];
        const avatarMatch = html.match(/"avatar":\s*\{[^}]*"url":\s*"(https:\/\/yt3[^"]+)"/);
        const avatar = avatarMatch?.[1] || ogImage;
        const displayName = ogTitle?.replace(' - YouTube', '').trim();
        if (avatar) return { displayName: displayName || null, avatar };
      }
    } catch {}

    // Strategy 2: noembed
    try {
      const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error && data.author_name) {
          return { displayName: data.author_name, avatar: data.thumbnail_url || null };
        }
      }
    } catch {}

    // Strategy 3: unavatar
    const username = extractUsername(clean, 'youtube');
    if (username) {
      return { displayName: null, avatar: `https://unavatar.io/youtube/${username}` };
    }
  }

  if (platform === 'tiktok') {
    const username = extractUsername(clean, 'tiktok');
    try {
      const pageRes = await fetch(clean, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'text/html' },
        redirect: 'follow',
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]
          || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/)?.[1];
        const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)?.[1];
        if (ogImage && !ogImage.includes('tiktok-sharing')) {
          return { displayName: ogTitle || null, avatar: ogImage };
        }
      }
    } catch {}
    if (username) return { displayName: null, avatar: `https://unavatar.io/tiktok/${username}` };
  }

  if (platform === 'instagram') {
    const username = extractUsername(clean, 'instagram');
    try {
      const pageRes = await fetch(clean, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Accept': 'text/html' },
        redirect: 'follow',
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/)?.[1]
          || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/)?.[1];
        const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/)?.[1];
        if (ogImage) return { displayName: ogTitle || null, avatar: ogImage };
      }
    } catch {}
    if (username) return { displayName: null, avatar: `https://unavatar.io/instagram/${username}` };
  }

  const username = extractUsername(clean, platform);
  if (username) return { displayName: null, avatar: `https://unavatar.io/${username}` };
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
