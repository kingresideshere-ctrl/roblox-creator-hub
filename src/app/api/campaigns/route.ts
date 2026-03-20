import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST create a campaign with platform stats
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { creator_id, name, spent, start_date, end_date, game, platforms } = body;

  if (!creator_id || !name?.trim()) {
    return NextResponse.json({ error: 'creator_id and name required' }, { status: 400 });
  }

  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .insert({
      creator_id,
      name: name.trim(),
      spent: spent || 0,
      game: game || null,
      start_date: start_date || null,
      end_date: end_date || null,
    })
    .select()
    .single();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  if (platforms && typeof platforms === 'object') {
    for (const [platform, stats] of Object.entries(platforms) as any) {
      const { data: platData, error: platErr } = await supabase
        .from('campaign_platforms')
        .insert({
          campaign_id: campaign.id,
          platform,
          views: stats.views || 0,
          likes: stats.likes || 0,
          comments: stats.comments || 0,
          shares: stats.shares || 0,
        })
        .select()
        .single();

      if (platErr) continue;

      if (stats.daily && Array.isArray(stats.daily)) {
        const startDate = new Date(start_date || Date.now());
        const dailyRows = stats.daily.map((views: number, i: number) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return { campaign_platform_id: platData.id, date: d.toISOString().split('T')[0], views };
        });
        await supabase.from('daily_views').insert(dailyRows);
      }
    }
  }

  return NextResponse.json(campaign, { status: 201 });
}

// PUT update campaign (name, spent, dates, platform stats)
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, name, spent, start_date, end_date, game, platforms } = body;

  if (!id) return NextResponse.json({ error: 'Campaign id required' }, { status: 400 });

  // Update campaign fields
  const updates: any = {};
  if (name !== undefined) updates.name = name.trim();
  if (spent !== undefined) updates.spent = spent;
  if (game !== undefined) updates.game = game;
  if (start_date !== undefined) updates.start_date = start_date;
  if (end_date !== undefined) updates.end_date = end_date;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('campaigns').update(updates).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Upsert platform stats
  if (platforms) {
    for (const [platform, stats] of Object.entries(platforms) as any) {
      // Check if platform record exists
      const { data: existing } = await supabase
        .from('campaign_platforms')
        .select('id')
        .eq('campaign_id', id)
        .eq('platform', platform)
        .single();

      if (existing) {
        // Update existing
        await supabase
          .from('campaign_platforms')
          .update({
            views: stats.views || 0,
            likes: stats.likes || 0,
            comments: stats.comments || 0,
            shares: stats.shares || 0,
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await supabase
          .from('campaign_platforms')
          .insert({
            campaign_id: id,
            platform,
            views: stats.views || 0,
            likes: stats.likes || 0,
            comments: stats.comments || 0,
            shares: stats.shares || 0,
          });
      }
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE campaign
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
