/**
 * One-off repair for photos that were stored sideways.
 *
 * Why this needs a human review step:
 *   Until the orientation fix in src/utils/image-compression.ts, uploads were
 *   re-encoded by sharp without applying the EXIF orientation, and sharp drops
 *   all metadata on output. The stored files therefore have no orientation tag,
 *   and code cannot tell a sideways portrait from a real landscape photo.
 *   So: scan -> you pick the rotation per photo in a local review page -> apply.
 *
 * Usage (from backend/, with backend/.env containing SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY):
 *
 *   npm run fix:photo-orientation -- scan
 *       Lists every stored photo and writes orientation/review.html.
 *       Open it in a browser, click photos to rotate them, then press
 *       "Download manifest" and save orientation-manifest.json into orientation/.
 *
 *   npm run fix:photo-orientation -- backup
 *       Downloads EVERY scanned photo and its _thumb into
 *       orientation/full-backup/<backupId>/ with a SHA-256 index. Read-only
 *       against production. `apply --yes` refuses to run without a complete
 *       backup that covers every photo in the manifest.
 *       (This migration changes no database rows, only image files, but take a
 *       database dump with scripts/backup.sh or backup.ps1 as well.)
 *
 *   npm run fix:photo-orientation -- apply orientation/orientation-manifest.json
 *       Dry run: prints what would change. Nothing is written.
 *
 *   npm run fix:photo-orientation -- apply orientation/orientation-manifest.json --yes
 *       For each photo: saves a local backup and a storage backup, rotates the
 *       file in place (same URL, so no database rows change), regenerates its
 *       _thumb, and records everything in orientation/runs/<runId>.json.
 *
 *   npm run fix:photo-orientation -- restore orientation/runs/<runId>.json --yes
 *       Puts the backed-up originals (and fresh thumbnails) back.
 *
 * Browsers and the storage CDN may keep showing the old image until their cache
 * expires (uploads default to a 1 hour cache), so give it time before judging.
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { generateThumbnail } from "../src/utils/image-compression";
import { THUMBNAIL_SETTINGS } from "../src/constants/image.constants";

type Rotation = 90 | 180 | 270;

interface ScannedPhoto {
  url: string;
  thumbUrl: string;
  bucket: string;
  path: string;
  table: string;
  rowId: string;
}

interface ManifestItem {
  url: string;
  rotate: Rotation;
}

interface RunEntry {
  url: string;
  bucket: string;
  path: string;
  thumbPath: string;
  rotate: Rotation;
  localBackup: string;
  storageBackupPath: string;
  status: "done" | "failed";
  error?: string;
}

interface RunLog {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  entries: RunEntry[];
}

const WORK_DIR = path.join(__dirname, "..", "orientation");
const SCAN_FILE = path.join(WORK_DIR, "photos.json");
const REVIEW_FILE = path.join(WORK_DIR, "review.html");
const RUNS_DIR = path.join(WORK_DIR, "runs");
const BACKUPS_DIR = path.join(WORK_DIR, "backups");
const FULL_BACKUP_DIR = path.join(WORK_DIR, "full-backup");

interface FullBackupIndex {
  backupId: string;
  scannedAt: string;
  completedAt?: string;
  files: { url: string; kind: "photo" | "thumb"; file: string; bytes: number; sha256: string }[];
  missing: { url: string; kind: "photo" | "thumb"; error: string }[];
}
const STORAGE_BACKUP_PREFIX = "_orientation-backup";

const TABLES = [
  { name: "moments", columns: ["photos"] },
  { name: "date_entries", columns: ["photos", "image_url"] },
  { name: "milestones", columns: ["photos"] },
] as const;

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in backend/.env."
    );
    process.exit(1);
  }
  return createClient(url, key);
}

/** Same parsing as scripts/regenerate-thumbnails.ts */
function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  try {
    const parts = new URL(url).pathname.split("/");
    const publicIndex = parts.findIndex((p) => p === "public");
    if (publicIndex === -1) return null;
    return {
      bucket: parts[publicIndex + 1],
      path: decodeURIComponent(parts.slice(publicIndex + 2).join("/")),
    };
  } catch {
    return null;
  }
}

/** Mirrors the naming in src/utils/image-upload.service.ts: name_thumb.ext */
function thumbPathFor(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1
    ? `${filePath}_thumb`
    : `${filePath.slice(0, dot)}_thumb${filePath.slice(dot)}`;
}

function thumbUrlFor(url: string): string {
  const q = url.indexOf("?");
  const base = q === -1 ? url : url.slice(0, q);
  const dot = base.lastIndexOf(".");
  return dot === -1 ? `${base}_thumb` : `${base.slice(0, dot)}_thumb${base.slice(dot)}`;
}

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" } as RequestInit);
  if (!res.ok) throw new Error(`download failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function uploadBuffer(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string,
  buffer: Buffer,
  upsert: boolean
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType: "image/jpeg",
    cacheControl: "60",
    upsert,
  });
  if (error) throw new Error(`upload to ${bucket}/${filePath} failed: ${error.message}`);
}

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------- scan

async function scan(): Promise<void> {
  const supabase = getSupabase();
  const seen = new Map<string, ScannedPhoto>();

  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table.name)
      .select(["id", ...table.columns].join(", "));
    if (error) {
      console.error(`Could not read ${table.name}: ${error.message}`);
      process.exit(1);
    }
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      const urls: string[] = [];
      for (const col of table.columns) {
        const value = row[col];
        if (Array.isArray(value)) urls.push(...value.filter((v) => typeof v === "string"));
        else if (typeof value === "string" && value) urls.push(value);
      }
      for (const url of urls) {
        if (url.includes("_thumb.") || seen.has(url)) continue;
        const parsed = parseStorageUrl(url);
        if (!parsed) {
          console.warn(`Skipping a URL that is not Supabase public storage (row ${row.id} in ${table.name})`);
          continue;
        }
        seen.set(url, {
          url,
          thumbUrl: thumbUrlFor(url),
          bucket: parsed.bucket,
          path: parsed.path,
          table: table.name,
          rowId: String(row.id),
        });
      }
    }
  }

  const photos = [...seen.values()];
  writeJson(SCAN_FILE, { scannedAt: new Date().toISOString(), photos });
  fs.writeFileSync(REVIEW_FILE, reviewHtml(photos));
  console.log(`Found ${photos.length} photos.`);
  console.log(`Review page: ${REVIEW_FILE}`);
  console.log(
    "Open it, click each sideways photo until it is upright, press 'Download manifest',"
  );
  console.log(`and save the file as ${path.join(WORK_DIR, "orientation-manifest.json")}.`);
}

function reviewHtml(photos: ScannedPhoto[]): string {
  const data = JSON.stringify(photos.map((p) => ({ url: p.url, thumbUrl: p.thumbUrl, table: p.table })))
    .replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Amori photo orientation review</title>
<style>
  :root{color-scheme:light dark;--bg:#f6f1ec;--fg:#2a2124;--card:#fff;--line:#e3d6d1;--accent:#c2416b}
  @media (prefers-color-scheme:dark){:root{--bg:#1c1517;--fg:#f3ebe8;--card:#271d20;--line:#3a2b30;--accent:#f07a9c}}
  body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
  header{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;z-index:1}
  h1{font-size:18px;margin:0 auto 0 0}
  button{font:inherit;padding:8px 14px;border-radius:99px;border:1px solid var(--line);background:var(--card);color:var(--fg);cursor:pointer}
  button.primary{background:var(--accent);border-color:var(--accent);color:#fff}
  p.help{margin:12px 16px;max-width:70ch}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;padding:0 16px 40px}
  .tile{background:var(--card);border:2px solid var(--line);border-radius:12px;padding:8px;cursor:pointer;text-align:center}
  .tile.changed{border-color:var(--accent)}
  .frame{width:100%;aspect-ratio:1;display:grid;place-items:center;overflow:hidden}
  .frame img{max-width:100%;max-height:100%;transition:transform .15s}
  .tile small{display:block;margin-top:6px;opacity:.75}
  .tile:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
</style></head><body>
<header><h1>Photo orientation review</h1><span id="count"></span>
<button id="reset" type="button">Reset all</button>
<button id="download" class="primary" type="button">Download manifest</button></header>
<p class="help">Click (or press Enter on) a photo to rotate it 90° clockwise. Click again to keep turning. Stop when it is upright. Photos you don't touch are left alone. When you're done, download the manifest and save it as <code>orientation-manifest.json</code> in the <code>backend/orientation</code> folder.</p>
<div class="grid" id="grid"></div>
<script>
const photos = ${data};
const rot = new Map();
const grid = document.getElementById('grid');
function label(r){return r ? 'rotate ' + r + '° clockwise' : 'unchanged';}
function updateCount(){document.getElementById('count').textContent = rot.size + ' of ' + photos.length + ' marked';}
photos.forEach((p) => {
  const tile = document.createElement('div');
  tile.className = 'tile'; tile.tabIndex = 0; tile.setAttribute('role','button');
  const frame = document.createElement('div'); frame.className = 'frame';
  const img = document.createElement('img'); img.loading = 'lazy'; img.alt = 'Photo from ' + p.table;
  img.src = p.thumbUrl; img.onerror = () => { img.onerror = null; img.src = p.url; };
  frame.appendChild(img);
  const cap = document.createElement('small'); cap.textContent = label(0);
  tile.append(frame, cap);
  const turn = () => {
    const next = ((rot.get(p.url) || 0) + 90) % 360;
    if (next) rot.set(p.url, next); else rot.delete(p.url);
    img.style.transform = 'rotate(' + next + 'deg)';
    cap.textContent = label(next);
    tile.classList.toggle('changed', !!next);
    tile.setAttribute('aria-label', 'Photo from ' + p.table + ', ' + label(next));
    updateCount();
  };
  tile.addEventListener('click', turn);
  tile.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } });
  tile.setAttribute('aria-label', 'Photo from ' + p.table + ', ' + label(0));
  grid.appendChild(tile);
});
updateCount();
document.getElementById('reset').onclick = () => location.reload();
document.getElementById('download').onclick = () => {
  const items = [...rot].map(([url, rotate]) => ({ url, rotate }));
  const blob = new Blob([JSON.stringify({ version: 1, createdAt: new Date().toISOString(), items }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'orientation-manifest.json'; a.click();
};
</script></body></html>
`;
}

// ---------------------------------------------------------------- full backup

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function fullBackup(): Promise<void> {
  if (!fs.existsSync(SCAN_FILE)) throw new Error("Run 'scan' first.");
  const scanData = readJson<{ scannedAt: string; photos: ScannedPhoto[] }>(SCAN_FILE);
  const backupId = new Date().toISOString().replace(/[:.]/g, "-");
  const root = path.join(FULL_BACKUP_DIR, backupId);
  const indexFile = path.join(root, "index.json");
  const index: FullBackupIndex = { backupId, scannedAt: scanData.scannedAt, files: [], missing: [] };

  for (const [n, p] of scanData.photos.entries()) {
    const targets: { url: string; kind: "photo" | "thumb"; rel: string }[] = [
      { url: p.url, kind: "photo", rel: path.join(p.bucket, p.path) },
      { url: p.thumbUrl, kind: "thumb", rel: path.join(p.bucket, thumbPathFor(p.path)) },
    ];
    for (const t of targets) {
      try {
        const buf = await download(t.url);
        const file = path.join(root, t.rel);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
        // Verify the bytes on disk match what was downloaded.
        if (sha256(fs.readFileSync(file)) !== sha256(buf)) throw new Error("written file does not match download");
        index.files.push({ url: t.url, kind: t.kind, file, bytes: buf.length, sha256: sha256(buf) });
      } catch (err) {
        // A missing thumbnail is tolerable (older uploads may not have one); a missing photo is not.
        index.missing.push({ url: t.url, kind: t.kind, error: err instanceof Error ? err.message : String(err) });
      }
    }
    if ((n + 1) % 10 === 0 || n + 1 === scanData.photos.length) {
      console.log(`  backed up ${n + 1}/${scanData.photos.length} photos`);
    }
    writeJson(indexFile, index);
  }

  index.completedAt = new Date().toISOString();
  writeJson(indexFile, index);
  const missingPhotos = index.missing.filter((m) => m.kind === "photo").length;
  const totalMb = index.files.reduce((s, f) => s + f.bytes, 0) / 1024 / 1024;
  console.log(`\nBackup ${backupId}: ${index.files.length} files, ${totalMb.toFixed(1)} MB in ${root}`);
  console.log(`Missing: ${missingPhotos} photo(s), ${index.missing.length - missingPhotos} thumbnail(s).`);
  console.log("Keep a copy of this folder somewhere safe (outside the repo) until you've checked the results.");
  if (missingPhotos) {
    console.error("BACKUP INCOMPLETE: some photos could not be downloaded. apply will refuse to touch those photos.");
    process.exitCode = 1;
  }
}

/** URLs that the newest completed full backup holds, for the current scan. */
function backedUpUrls(): Set<string> {
  if (!fs.existsSync(FULL_BACKUP_DIR) || !fs.existsSync(SCAN_FILE)) return new Set();
  const scannedAt = readJson<{ scannedAt: string }>(SCAN_FILE).scannedAt;
  const candidates = fs
    .readdirSync(FULL_BACKUP_DIR)
    .map((d) => path.join(FULL_BACKUP_DIR, d, "index.json"))
    .filter((f) => fs.existsSync(f))
    .map((f) => readJson<FullBackupIndex>(f))
    .filter((i) => i.completedAt && i.scannedAt === scannedAt)
    .sort((a, b) => b.backupId.localeCompare(a.backupId));
  const latest = candidates[0];
  if (!latest) return new Set();
  return new Set(
    latest.files
      .filter((f) => f.kind === "photo" && fs.existsSync(f.file) && sha256(fs.readFileSync(f.file)) === f.sha256)
      .map((f) => f.url)
  );
}

// ---------------------------------------------------------------- apply

function previouslyRotated(): Set<string> {
  const done = new Set<string>();
  if (!fs.existsSync(RUNS_DIR)) return done;
  for (const file of fs.readdirSync(RUNS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const log = readJson<RunLog>(path.join(RUNS_DIR, file));
    if ((log as RunLog & { restored?: boolean }).restored) continue;
    for (const e of log.entries) if (e.status === "done") done.add(e.url);
  }
  return done;
}

function loadManifest(file: string): ManifestItem[] {
  const manifest = readJson<{ version: number; items: ManifestItem[] }>(file);
  if (manifest.version !== 1 || !Array.isArray(manifest.items)) {
    throw new Error("Manifest is not a version 1 orientation manifest.");
  }
  if (!fs.existsSync(SCAN_FILE)) {
    throw new Error("Run 'scan' first; apply only accepts photos found by a scan.");
  }
  const scanned = new Set(readJson<{ photos: ScannedPhoto[] }>(SCAN_FILE).photos.map((p) => p.url));
  for (const item of manifest.items) {
    if (![90, 180, 270].includes(item.rotate)) {
      throw new Error(`Invalid rotation ${item.rotate} (allowed: 90, 180, 270).`);
    }
    if (!scanned.has(item.url)) {
      throw new Error("Manifest contains a photo that the last scan did not find. Re-run scan.");
    }
  }
  return manifest.items;
}

async function apply(manifestFile: string, confirmed: boolean, force: boolean): Promise<void> {
  const items = loadManifest(manifestFile);
  const already = previouslyRotated();
  const repeats = items.filter((i) => already.has(i.url));
  if (repeats.length && !force) {
    console.error(
      `${repeats.length} photo(s) in this manifest were already rotated by an earlier run. ` +
        "Rotating again would turn them further. Remove them, restore that run, or pass --force."
    );
    process.exit(1);
  }

  const byAngle = items.reduce<Record<number, number>>((acc, i) => {
    acc[i.rotate] = (acc[i.rotate] || 0) + 1;
    return acc;
  }, {});
  console.log(`Manifest: ${items.length} photo(s) to rotate`, byAngle);

  const backedUp = backedUpUrls();
  const notBackedUp = items.filter((i) => !backedUp.has(i.url));

  if (!confirmed) {
    for (const i of items) {
      const p = parseStorageUrl(i.url)!;
      const flag = backedUp.has(i.url) ? "" : "  [NOT IN FULL BACKUP]";
      console.log(`  would rotate ${i.rotate}°  ${p.bucket}/${p.path}  (+ ${thumbPathFor(p.path)})${flag}`);
    }
    if (notBackedUp.length) {
      console.log(`\n${notBackedUp.length} photo(s) are not in a verified full backup of the current scan. Run 'backup' first.`);
    }
    console.log("\nDry run only. Re-run with --yes to rotate these photos.");
    return;
  }

  if (notBackedUp.length) {
    console.error(
      `Refusing to run: ${notBackedUp.length} photo(s) in the manifest are not in a complete, ` +
        "checksum-verified full backup of the current scan. Run 'backup' and check its output first."
    );
    process.exit(1);
  }

  const supabase = getSupabase();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = path.join(RUNS_DIR, `${runId}.json`);
  const log: RunLog = { runId, startedAt: new Date().toISOString(), entries: [] };

  for (const [n, item] of items.entries()) {
    const { bucket, path: filePath } = parseStorageUrl(item.url)!;
    const thumbPath = thumbPathFor(filePath);
    const localBackup = path.join(BACKUPS_DIR, runId, bucket, filePath);
    const storageBackupPath = `${STORAGE_BACKUP_PREFIX}/${runId}/${filePath}`;
    const entry: RunEntry = {
      url: item.url,
      bucket,
      path: filePath,
      thumbPath,
      rotate: item.rotate,
      localBackup,
      storageBackupPath,
      status: "failed",
    };
    try {
      const original = await download(item.url);

      // Back up before touching anything: locally, then in the same bucket.
      fs.mkdirSync(path.dirname(localBackup), { recursive: true });
      fs.writeFileSync(localBackup, original);
      await uploadBuffer(supabase, bucket, storageBackupPath, original, false);

      const rotated = await sharp(original, { failOn: "none" })
        .rotate(item.rotate)
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      await uploadBuffer(supabase, bucket, filePath, rotated, true);

      const thumb = await generateThumbnail(
        rotated,
        THUMBNAIL_SETTINGS.size,
        THUMBNAIL_SETTINGS.quality
      );
      await uploadBuffer(supabase, bucket, thumbPath, thumb, true);

      entry.status = "done";
      console.log(`[${n + 1}/${items.length}] rotated ${item.rotate}°  ${bucket}/${filePath}`);
    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
      console.error(`[${n + 1}/${items.length}] FAILED ${bucket}/${filePath}: ${entry.error}`);
    }
    log.entries.push(entry);
    writeJson(logFile, log); // persist after every photo so a crash keeps an accurate log
  }

  log.finishedAt = new Date().toISOString();
  writeJson(logFile, log);
  const failed = log.entries.filter((e) => e.status === "failed").length;
  console.log(`\nDone: ${log.entries.length - failed} rotated, ${failed} failed.`);
  console.log(`Run log (needed for restore): ${logFile}`);
}

// ---------------------------------------------------------------- restore

async function restore(logFile: string, confirmed: boolean): Promise<void> {
  const log = readJson<RunLog & { restored?: boolean }>(logFile);
  const done = log.entries.filter((e) => e.status === "done");
  console.log(`Run ${log.runId}: ${done.length} photo(s) to restore.`);
  if (!confirmed) {
    done.forEach((e) => console.log(`  would restore ${e.bucket}/${e.path}`));
    console.log("\nDry run only. Re-run with --yes to restore.");
    return;
  }
  const supabase = getSupabase();
  let failed = 0;
  for (const e of done) {
    try {
      const original = fs.existsSync(e.localBackup)
        ? fs.readFileSync(e.localBackup)
        : await (async () => {
            const { data, error } = await supabase.storage.from(e.bucket).download(e.storageBackupPath);
            if (error || !data) throw new Error(`no backup found (${error?.message ?? "empty"})`);
            return Buffer.from(await data.arrayBuffer());
          })();
      await uploadBuffer(supabase, e.bucket, e.path, original, true);
      const thumb = await generateThumbnail(original, THUMBNAIL_SETTINGS.size, THUMBNAIL_SETTINGS.quality);
      await uploadBuffer(supabase, e.bucket, e.thumbPath, thumb, true);
      console.log(`restored ${e.bucket}/${e.path}`);
    } catch (err) {
      failed++;
      console.error(`FAILED ${e.bucket}/${e.path}: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (!failed) {
    log.restored = true;
    writeJson(logFile, log);
  }
  console.log(`\nRestore finished with ${failed} failure(s).`);
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const [command, file, ...flags] = process.argv.slice(2);
  const confirmed = flags.includes("--yes") || file === "--yes";
  const force = flags.includes("--force");
  fs.mkdirSync(WORK_DIR, { recursive: true });

  switch (command) {
    case "scan":
      return scan();
    case "backup":
      return fullBackup();
    case "apply":
      if (!file || file.startsWith("--")) throw new Error("Usage: apply <manifest.json> [--yes] [--force]");
      return apply(path.resolve(file), confirmed, force);
    case "restore":
      if (!file || file.startsWith("--")) throw new Error("Usage: restore <runs/<runId>.json> [--yes]");
      return restore(path.resolve(file), confirmed);
    default:
      console.log("Usage: fix-photo-orientation <scan | backup | apply <manifest> [--yes] [--force] | restore <runLog> [--yes]>");
      process.exit(command ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
