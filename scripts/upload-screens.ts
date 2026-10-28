/**
 * Uploads screenshot groups from the "adding games screens" folder to the
 * public `game-images` bucket, under deterministic paths that mock-data.ts
 * can reference directly:
 *
 *   game-images/screens/<slug>/01.jpg, 02.jpg, …
 *
 * Files in the folder are grouped by their leading number — `5.jpg`,
 * `5 (1).jpg`, `5 (2).jpg` … all belong to group 5 (the bare file sorts
 * first). Uploads are upserts, so re-running is safe — but note that objects
 * are served with a one-year cache header, so *replacing* an image at the same
 * path keeps the old picture alive in CDN/optimizer caches. To swap content,
 * use a fresh slug folder and repoint mock-data instead. After uploading, any
 * stale files left in the slug's folder (from an earlier, larger group) are
 * removed so the folder always mirrors the group exactly.
 *
 * Usage: npx tsx scripts/upload-screens.ts <slug>=<group> [<slug>=<group> …]
 *   e.g. npx tsx scripts/upload-screens.ts yoga-challenge=1 two-hands=2
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key);

const FOLDER = process.env.SCREENS_DIR ?? "adding games screens";
const BUCKET = "game-images";

const pairs = process.argv.slice(2).map((arg) => {
  const m = /^([a-z0-9-]+)=(\d+)$/.exec(arg);
  if (!m) {
    console.error(`Bad argument "${arg}" — expected <slug>=<group>, e.g. yoga-challenge=1`);
    process.exit(1);
  }
  return { slug: m[1], group: Number(m[2]) };
});
if (!pairs.length) {
  console.error("Nothing to do. Usage: npx tsx scripts/upload-screens.ts <slug>=<group> …");
  process.exit(1);
}

function filesForGroup(group: number): string[] {
  return readdirSync(FOLDER)
    .map((name) => {
      const m = /^(\d+)(?: \((\d+)\))?\.(jpe?g|png|webp)$/i.exec(name);
      if (!m || Number(m[1]) !== group) return null;
      return { name, order: m[2] ? Number(m[2]) : 0 };
    })
    .filter((x): x is { name: string; order: number } => x !== null)
    .sort((a, b) => a.order - b.order)
    .map((x) => x.name);
}

async function main() {
  for (const { slug, group } of pairs) {
    const files = filesForGroup(group);
    if (!files.length) {
      console.error(`✗ ${slug}: no files for group ${group} in "${FOLDER}"`);
      continue;
    }
    console.log(`${slug} (group ${group}): ${files.length} file(s)`);
    for (let i = 0; i < files.length; i++) {
      const src = join(FOLDER, files[i]);
      const ext = files[i].toLowerCase().endsWith(".png") ? "png" : files[i].toLowerCase().endsWith(".webp") ? "webp" : "jpg";
      const path = `screens/${slug}/${String(i + 1).padStart(2, "0")}.${ext}`;
      const body = readFileSync(src);
      const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
        cacheControl: "31536000",
        upsert: true,
        contentType: ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg",
      });
      if (error) {
        console.error(`  ✗ ${files[i]} → ${path}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      console.log(`  ✓ ${files[i]} → ${data.publicUrl}`);
    }

    // Prune stale objects beyond the group's size.
    const { data: existing, error: listErr } = await supabase.storage.from(BUCKET).list(`screens/${slug}`, { limit: 200 });
    if (listErr) {
      console.error(`  ⚠ could not list screens/${slug}: ${listErr.message}`);
      continue;
    }
    const keep = new Set(files.map((_, i) => String(i + 1).padStart(2, "0")));
    const stale = (existing ?? [])
      .map((o) => o.name)
      .filter((name) => !keep.has(name.replace(/\.[a-z]+$/i, "")))
      .map((name) => `screens/${slug}/${name}`);
    if (stale.length) {
      const { error } = await supabase.storage.from(BUCKET).remove(stale);
      if (error) console.error(`  ⚠ prune failed: ${error.message}`);
      else console.log(`  🧹 removed ${stale.length} stale file(s): ${stale.map((p) => p.split("/").pop()).join(", ")}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
