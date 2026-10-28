/**
 * Idempotent seed / sync script — pushes MOCK_GAMES and MOCK_EVENT (the
 * app's own source of truth in src/lib/mock-data.ts and
 * src/lib/event-mock-data.ts) into the live Supabase project defined by
 * .env.local.
 *
 * Games/events are matched by slug. New ones are inserted with their media and
 * documents. Existing ones are left untouched by default (live edits win); the
 * only additive exception is gallery images whose URL isn't in the row yet and
 * a still-empty cover, which are backfilled. Pass --sync to force mock-data
 * content over existing rows. The event's program and to-dos are only seeded
 * on first creation.
 *
 * Usage: npx tsx scripts/seed.ts [--sync]
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

import { MOCK_EVENT } from "../src/lib/event-mock-data";
import { MOCK_GAMES } from "../src/lib/mock-data";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const SYNC = process.argv.includes("--sync");

async function seedGames() {
  let inserted = 0;
  let synced = 0;
  let skipped = 0;
  let backfilled = 0;

  for (const game of MOCK_GAMES) {
    const { data: existing, error: findErr } = await supabase
      .from("games")
      .select("id, cover_url")
      .eq("slug", game.slug)
      .maybeSingle();

    if (findErr) {
      console.error(`✗ games/${game.slug}: lookup failed —`, findErr.message);
      continue;
    }

    const { id: _id, media, documents, created_at: _c, updated_at: _u, ...row } = game;

    if (existing) {
      // Additive backfill (always on): gallery images that mock-data.ts gained
      // after the row was first seeded are inserted if their URL isn't there yet,
      // and a still-empty cover is filled in. Nothing live is ever replaced.
      if (media.length) {
        const { data: live } = await supabase.from("media_files").select("url").eq("game_id", existing.id);
        const have = new Set((live ?? []).map((m) => m.url));
        const missing = media.filter((m) => !have.has(m.url));
        if (missing.length) {
          const rows = missing.map(({ id: _mid, game_id: _gid, created_at: _mc, ...m }) => ({ ...m, game_id: existing.id }));
          const { error } = await supabase.from("media_files").insert(rows);
          if (error) console.error(`  ⚠ games/${game.slug}: media backfill failed —`, error.message);
          else {
            backfilled += missing.length;
            console.log(`+ games/${game.slug}: ${missing.length} gallery image(s) added`);
          }
        }
      }
      if (!existing.cover_url && row.cover_url) {
        const { error } = await supabase.from("games").update({ cover_url: row.cover_url }).eq("id", existing.id);
        if (error) console.error(`  ⚠ games/${game.slug}: cover backfill failed —`, error.message);
        else console.log(`+ games/${game.slug}: empty cover filled`);
      }

      // Live edits made through the site win by default. Pass --sync to force
      // mock-data.ts content over existing rows (title, rules, cover, …).
      if (!SYNC) {
        skipped++;
        continue;
      }
      const { error } = await supabase.from("games").update(row).eq("id", existing.id);
      if (error) console.error(`✗ games/${game.slug}: sync failed —`, error.message);
      else synced++;
      continue;
    }

    const { data: created, error: gameErr } = await supabase.from("games").insert(row).select("id").single();
    if (gameErr || !created) {
      console.error(`✗ games/${game.slug}: insert failed —`, gameErr?.message);
      continue;
    }

    if (media.length) {
      const rows = media.map(({ id: _mid, game_id: _gid, created_at: _mc, ...m }) => ({ ...m, game_id: created.id }));
      const { error } = await supabase.from("media_files").insert(rows);
      if (error) console.error(`  ⚠ games/${game.slug}: media insert failed —`, error.message);
    }
    if (documents.length) {
      const rows = documents.map(({ id: _did, game_id: _gid2, created_at: _dc, ...d }) => ({
        ...d,
        game_id: created.id,
      }));
      const { error } = await supabase.from("attached_documents").insert(rows);
      if (error) console.error(`  ⚠ games/${game.slug}: documents insert failed —`, error.message);
    }

    inserted++;
    console.log(`✓ games/${game.slug} (new)`);
  }

  console.log(
    `Games: ${inserted} inserted, ${synced} synced, ${skipped} left untouched, ${backfilled} gallery image(s) backfilled${SYNC ? "" : " (use --sync to overwrite existing rows from mock-data.ts)"}.`,
  );
}

async function seedEvent() {
  const { data: existing, error: findErr } = await supabase
    .from("events")
    .select("id")
    .eq("slug", MOCK_EVENT.slug)
    .maybeSingle();

  if (findErr) {
    if (findErr.code === "PGRST205" || /relation .* does not exist/i.test(findErr.message)) {
      console.error(
        `✗ event/${MOCK_EVENT.slug}: the "events" table doesn't exist yet — ` +
          `run the updated supabase/schema.sql in the Supabase SQL editor first.`,
      );
      return;
    }
    console.error(`✗ event/${MOCK_EVENT.slug}: lookup failed —`, findErr.message);
    return;
  }

  const row = { slug: MOCK_EVENT.slug, title: MOCK_EVENT.title, event_date: MOCK_EVENT.event_date, notes_md: MOCK_EVENT.notes_md };

  if (existing) {
    if (!SYNC) {
      console.log(`Event: left untouched.`);
      return;
    }
    const { error } = await supabase.from("events").update(row).eq("id", existing.id);
    if (error) console.error(`✗ event/${MOCK_EVENT.slug}: sync failed —`, error.message);
    else console.log(`Event: synced (program and to-dos left untouched).`);
    return;
  }

  const { data: created, error: eventErr } = await supabase.from("events").insert(row).select("id").single();
  if (eventErr || !created) {
    console.error(`✗ event/${MOCK_EVENT.slug}: insert failed —`, eventErr?.message);
    return;
  }

  if (MOCK_EVENT.todos.length) {
    const rows = MOCK_EVENT.todos.map(({ id: _tid, event_id: _eid, created_at: _tc, ...t }) => ({
      ...t,
      event_id: created.id,
    }));
    const { error } = await supabase.from("todo_items").insert(rows);
    if (error) console.error(`  ⚠ event/${MOCK_EVENT.slug}: todo insert failed —`, error.message);
  }

  console.log(`✓ event/${MOCK_EVENT.slug} (new)`);
}

async function main() {
  await seedGames();
  await seedEvent();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
