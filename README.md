# Games Night — Collection & Rules Hub

A shared shelf of board, card, sheet and party games. Rules, components checklist, photo gallery, video clips, voice notes and attached files — **editable by anyone with the link, no login**.

Stack: **Next.js 16 (App Router) · Tailwind v4 · shadcn/ui (Base UI) · Lucide · Supabase**.

## Run it

```bash
npm install
npm run dev
```

Without Supabase env vars the app runs in **local mode**: 21 seeded games from `src/lib/mock-data.ts`, and anything you add/edit is kept in `localStorage` (uploaded images persist as data URLs; video/audio/docs are session-only object URLs).

## Connect Supabase

1. Create a project, open the SQL editor, paste and run [`supabase/schema.sql`](supabase/schema.sql).
   It creates `games`, `media_files`, `attached_documents`, permissive RLS policies for open contribution, and four public storage buckets: `game-images`, `game-videos`, `game-audio`, `game-docs`.
2. Copy `.env.example` → `.env.local` and fill in (URL is the bare project URL — **no** `/rest/v1/` suffix):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. Restart `npm run dev`. Reads go through `src/lib/data.ts` (server), writes and uploads through `src/lib/repository.ts` + `src/lib/supabase/storage.ts` (client).
4. The schema doesn't seed itself — the live `games` table starts empty. Run `npm run seed` to push everything from `src/lib/mock-data.ts` into it. Rows are matched by `slug`: new ones are inserted, existing ones are **left untouched** so edits made live through the site (titles, rules, covers set from the gallery…) are never overwritten. Pass `npm run seed -- --sync` to deliberately force mock-data content over existing rows.

## Where things live

| Path | What |
| --- | --- |
| `src/app/page.tsx` → `components/home-view.tsx` | Home: header with search, category chips, player/duration/sort filters, card grid, mobile nav |
| `src/app/game/[id]/page.tsx` → `components/game/game-detail-view.tsx` | Detail: hero + specs + toolbar, rules/setup/notes tabs (Markdown), interactive checklist, gallery + lightbox, HTML5 video, custom audio player, file download cards |
| `components/game-form-sheet.tsx` | Add / edit game sheet (bottom sheet on mobile, side panel on desktop) with multi-file uploader |
| `components/add-media-sheet.tsx` | Add photos / clips / voice notes / docs to an existing game |
| `src/lib/filters.ts` | Client-side search scoring + category / players / duration filters + sort |
| `src/lib/types.ts` | Domain types & categories |
| `supabase/schema.sql` | Tables, triggers, RLS, storage buckets |
| `scripts/seed.ts` | Pushes `MOCK_GAMES` into a live Supabase project (`npx tsx scripts/seed.ts`) |
| `scripts/upload-screens.ts` | Uploads numbered screenshot groups from `adding games screens/` to the `game-images` bucket as `screens/<slug>/NN.jpg` (`npx tsx scripts/upload-screens.ts <slug>=<group> …`) — mock-data references them via `s(slug, n)` |
