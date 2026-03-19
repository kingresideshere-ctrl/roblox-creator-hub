import { NextRequest, NextResponse } from 'next/server';

// Auto-fetch stats from a video/post URL by scraping the page
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { url, platform } = body;

  if (!url || !platform) {
    return NextResponse.json({ error: 'Missing url or platform' }, { status: 400 });
  }

  try {
    const stats = await fetchStats(url.trim(), platform);
    return NextResponse.json(stats);
  } catch (e) {
    return NextResponse.json({ views: 0, likes: 0, comments: 0, shares: 0, title: null, error: 'Failed to fetch' });
  }
}

async function fetchStats(url: string, platform: string) {
  const clean = url.replace(/\/+$/, '');
  const result = { views: 0, likes: 0, comments: 0, shares: 0, title: null as string | null };

  try {
    const res = await fetch(clean, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) return result;
    const html = await res.text();

    // Extract title
    const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/)?.[1]
      || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/)?.[1]
      || html.match(/<title>([^<]+)<\/title>/)?.[1];
    result.title = ogTitle?.trim() || null;

    if (platform === 'youtube') {
      // Try to extract view count from YouTube page
      const viewMatch = html.match(/"viewCount"\s*:\s*"(\d+)"/);
      if (viewMatch) result.views = parseInt(viewMatch[1]);

      // Like count
      const likeMatch = html.match(/"likeCount"\s*:\s*"?(\d+)"?/)
        || html.match(/like this video along with ([\d,]+) other people/);
      if (likeMatch) result.likes = parseInt(likeMatch[1].replace(/,/g, ''));

      // Comment count
      const commentMatch = html.match(/"commentCount"\s*:\s*"?(\d+)"?/);
      if (commentMatch) result.comments = parseInt(commentMatch[1]);

      // Subscriber count (bonus)
      const subMatch = html.match(/"subscriberCountText"\s*:\s*\{[^}]*"simpleText"\s*:\s*"([^"]+)"/);
    }

    if (platform === 'tiktok') {
      // TikTok embeds stats in JSON-LD or script tags
      const statsMatch = html.match(/"playCount"\s*:\s*(\d+)/);
      if (statsMatch) result.views = parseInt(statsMatch[1]);

      const likeMatch = html.match(/"diggCount"\s*:\s*(\d+)/)
        || html.match(/"likeCount"\s*:\s*(\d+)/);
      if (likeMatch) result.likes = parseInt(likeMatch[1]);

      const commentMatch = html.match(/"commentCount"\s*:\s*(\d+)/);
      if (commentMatch) result.comments = parseInt(commentMatch[1]);

      const shareMatch = html.match(/"shareCount"\s*:\s*(\d+)/);
      if (shareMatch) result.shares = parseInt(shareMatch[1]);

      // Fallback: og:description often has "X Likes, Y Comments"
      if (!result.views) {
        const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/)?.[1];
        if (ogDesc) {
          const likesM = ogDesc.match(/([\d.]+[KMB]?)\s*Likes/i);
          const commentsM = ogDesc.match(/([\d.]+[KMB]?)\s*Comments/i);
          if (likesM) result.likes = parseAbbreviated(likesM[1]);
          if (commentsM) result.comments = parseAbbreviated(commentsM[1]);
        }
      }
    }

    if (platform === 'instagram') {
      // Instagram og:description: "X likes, Y comments"
      const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/)?.[1]
        || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/)?.[1];
      if (ogDesc) {
        const likesM = ogDesc.match(/([\d,]+)\s*likes/i);
        const commentsM = ogDesc.match(/([\d,]+)\s*comments/i);
        if (likesM) result.likes = parseInt(likesM[1].replace(/,/g, ''));
        if (commentsM) result.comments = parseInt(commentsM[1].replace(/,/g, ''));
      }

      // Try video view count
      const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/)
        || html.match(/"playCount"\s*:\s*(\d+)/);
      if (viewMatch) result.views = parseInt(viewMatch[1]);

      // Instagram interaction counts from JSON
      const igLikes = html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
      if (igLikes) result.likes = parseInt(igLikes[1]);
      const igComments = html.match(/"edge_media_preview_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/)
        || html.match(/"edge_media_to_comment"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
      if (igComments) result.comments = parseInt(igComments[1]);
    }
  } catch {}

  return result;
}

function parseAbbreviated(str: string): number {
  const num = parseFloat(str.replace(/,/g, ''));
  if (str.endsWith('B') || str.endsWith('b')) return Math.round(num * 1000000000);
  if (str.endsWith('M') || str.endsWith('m')) return Math.round(num * 1000000);
  if (str.endsWith('K') || str.endsWith('k')) return Math.round(num * 1000);
  return Math.round(num);
}
