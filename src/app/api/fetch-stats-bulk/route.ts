import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { urls } = body; // Array of { url, platform }

  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  }

  // Limit to 10 URLs per request
  const limited = urls.slice(0, 10);

  const results = await Promise.all(
    limited.map(async ({ url, platform }: { url: string; platform: string }) => {
      try {
        const res = await fetch(new URL('/api/fetch-stats', req.nextUrl.origin), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, platform }),
        });
        const data = await res.json();
        return { url, platform, ...data, success: !!(data.views || data.likes || data.comments || data.shares) };
      } catch {
        return { url, platform, views: 0, likes: 0, comments: 0, shares: 0, success: false };
      }
    })
  );

  // Aggregate totals per platform
  const totals: Record<string, { views: number; likes: number; comments: number; shares: number }> = {};
  results.forEach(r => {
    if (!totals[r.platform]) totals[r.platform] = { views: 0, likes: 0, comments: 0, shares: 0 };
    totals[r.platform].views += r.views || 0;
    totals[r.platform].likes += r.likes || 0;
    totals[r.platform].comments += r.comments || 0;
    totals[r.platform].shares += r.shares || 0;
  });

  return NextResponse.json({
    results,
    totals,
    successCount: results.filter(r => r.success).length,
    totalCount: results.length,
  });
}
