# Roblox Creator Hub — Campaign Analytics Dashboard

Track your Roblox content creators across TikTok, YouTube, and Instagram. See who's worth rebooking and where your ad spend is delivering.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Profile Pics**: Server-side fetched via unavatar.io / noembed.com

---

## Setup Guide (15 minutes)

### Step 1: Create a GitHub Repo

1. Go to [github.com/new](https://github.com/new)
2. Name it `roblox-creator-hub`, set to **Private**
3. Push this code:

```bash
cd roblox-creator-hub
git init
git add .
git commit -m "Initial commit: Roblox Creator Hub"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/roblox-creator-hub.git
git push -u origin main
```

### Step 2: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account / sign in
2. Click **New Project**
3. Name: `roblox-creator-hub`
4. Set a strong database password (save it)
5. Region: pick the closest to you
6. Wait for the project to finish provisioning (~2 min)

### Step 3: Run the Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` from this project and paste it
4. Click **Run** — you should see all tables created successfully

### Step 4: Get Your Supabase Keys

1. In Supabase, go to **Settings → API**
2. Copy:
   - **Project URL** → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 5: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `roblox-creator-hub` repository
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**
6. Wait ~2 minutes — your dashboard is live!

### Step 6: Local Development (Optional)

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Visit `http://localhost:3000`

---

## Features

- **Add creators** with TikTok, YouTube, Instagram links
- **Live profile picture fetch** — paste a link, see their real avatar
- **Log campaigns** — track spend per promotion round
- **Per-platform breakdown** — views, likes, comments, shares by TikTok/YouTube/Instagram
- **7-day view charts** — stacked area charts showing daily performance
- **ROI leaderboard** — creators ranked by cost per 1K views (CPM)
- **Verdict system** — instant rebook recommendation (Excellent/Good/Fair/Poor)
- **Delete creators** — clean up your roster

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── creators/route.ts   # CRUD for creators
│   │   ├── campaigns/route.ts  # CRUD for campaigns
│   │   └── profile/route.ts    # Server-side profile pic fetcher
│   ├── globals.css             # Tailwind + custom vars
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main dashboard
├── components/
│   ├── CreatorAvatar.tsx       # Avatar with real pic support
│   ├── AddCreatorModal.tsx     # Creator form with live preview
│   └── AddCampaignModal.tsx    # Campaign logging form
└── lib/
    ├── supabase.ts             # Supabase client
    ├── types.ts                # TypeScript interfaces
    └── utils.ts                # Formatting & calculation helpers
```

---

## Future Additions

- [ ] Auth (Supabase Auth) for team login
- [ ] Auto-fetch view counts from platform APIs
- [ ] CSV export for accounting
- [ ] Date range filters
- [ ] Notification when a creator hits a view milestone
