import { NextRequest, NextResponse } from 'next/server';

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) return result;
    const html = await res.text();

    if (platform === 'youtube') {
      // YouTube embeds stats in JSON within the page
      const viewMatch = html.match(/"viewCount"\s*:\s*"(\d+)"/);
      if (viewMatch) result.views = parseInt(viewMatch[1]);

      const likeMatch = html.match(/"likeCount"\s*:\s*"?(\d+)"?/);
      if (likeMatch) result.likes = parseInt(likeMatch[1]);

      const commentMatch = html.match(/"commentCount"\s*:\s*"?(\d+)"?/);
      if (commentMatch) result.comments = parseInt(commentMatch[1]);

      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      result.title = titleMatch?.[1]?.replace(' - YouTube', '').trim() || null;
    }

    if (platform === 'tiktok') {
      // TikTok embeds data in __UNIVERSAL_DATA_FOR_REHYDRATION__ script tag
      const dataStart = html.indexOf('__UNIVERSAL_DATA_FOR_REHYDRATION__');
      if (dataStart > -1) {
        const jsonStart = html.indexOf('>', dataStart) + 1;
        const jsonEnd = html.indexOf('</script>', jsonStart);
        if (jsonEnd > jsonStart) {
          try {
            // Clean control characters that TikTok sometimes includes
            const rawJson = html.substring(jsonStart, jsonEnd).trim().replace(/[\x00-\x1f]/g, '');
            const data = JSON.parse(rawJson);
            const detail = data?.__DEFAULT_SCOPE__?.['webapp.video-detail'] || {};
            const item = detail?.itemInfo?.itemStruct || {};
            const statsV2 = item.statsV2 || item.stats || {};
            
            result.views = parseInt(statsV2.playCount) || 0;
            result.likes = parseInt(statsV2.diggCount) || parseInt(statsV2.likeCount) || 0;
            result.comments = parseInt(statsV2.commentCount) || 0;
            result.shares = parseInt(statsV2.shareCount) || 0;
            result.title = item.desc || null;
          } catch {}
        }
      }
      
      // Fallback: try regex on the full HTML
      if (!result.views) {
        const playMatch = html.match(/"playCount"\s*:\s*"?(\d+)/);
        if (playMatch) result.views = parseInt(playMatch[1]);
      }
      if (!result.likes) {
        const likeMatch = html.match(/"diggCount"\s*:\s*"?(\d+)/) || html.match(/"likeCount"\s*:\s*"?(\d+)/);
        if (likeMatch) result.likes = parseInt(likeMatch[1]);
      }
      if (!result.comments) {
        const commentMatch = html.match(/"commentCount"\s*:\s*"?(\d+)/);
        if (commentMatch) result.comments = parseInt(commentMatch[1]);
      }
      if (!result.shares) {
        const shareMatch = html.match(/"shareCount"\s*:\s*"?(\d+)/);
        if (shareMatch) result.shares = parseInt(shareMatch[1]);
      }

      // Fallback: og:description
      if (!result.views && !result.likes) {
        const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/)?.[1]
          || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/)?.[1];
        if (ogDesc) {
          const likesM = ogDesc.match(/([\d.]+[KMB]?)\s*Likes/i);
          const commentsM = ogDesc.match(/([\d.]+[KMB]?)\s*Comments/i);
          if (likesM) result.likes = parseAbbreviated(likesM[1]);
          if (commentsM) result.comments = parseAbbreviated(commentsM[1]);
        }
      }

      // Title fallback
      if (!result.title) {
        const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/)?.[1];
        result.title = ogTitle?.trim() || null;
      }
    }

    if (platform === 'instagram') {
      // Instagram og:description and embedded JSON
      const ogDesc = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/)?.[1]
        || html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/)?.[1];
      if (ogDesc) {
        const likesM = ogDesc.match(/([\d,]+)\s*likes/i);
        const commentsM = ogDesc.match(/([\d,]+)\s*comments/i);
        if (likesM) result.likes = parseInt(likesM[1].replace(/,/g, ''));
        if (commentsM) result.comments = parseInt(commentsM[1].replace(/,/g, ''));
      }

      const viewMatch = html.match(/"video_view_count"\s*:\s*(\d+)/) || html.match(/"playCount"\s*:\s*(\d+)/);
      if (viewMatch) result.views = parseInt(viewMatch[1]);

      const igLikes = html.match(/"edge_media_preview_like"\s*:\s*\{\s*"count"\s*:\s*(\d+)/);
      if (igLikes) result.likes = parseInt(igLikes[1]);

      const ogTitle = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/)?.[1];
      result.title = ogTitle?.trim() || null;
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
