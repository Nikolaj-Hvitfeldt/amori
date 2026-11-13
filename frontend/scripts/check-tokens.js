#!/usr/bin/env node
/**
 * check:tokens [E6]. Node built-ins only.
 *
 * Fails (exit 1) when a .ts/.tsx file under frontend/src contains:
 *   - a hex colour literal inside a string (#rgb, #rgba, #rrggbb, #rrggbbaa);
 *   - an rgb(/rgba( literal with numeric channels;
 *   - an emoji, in src/ui/** only (UI icons come from Lucide [5B]).
 *
 * Skipped: src/theme/** (the only home of colour values) and tests.
 * Colours built from tokens at runtime, e.g. `rgba(${r}, …)`, are not literals
 * and pass.
 *
 * Usage: npm run check:tokens
 */
const fs = require("fs");
const path = require("path");

/**
 * Legacy files that still hard-code colours. They migrate to tokens in
 * Phases 3–4; this list reached EMPTY at the end of Phase 4 and stays empty.
 * Never add to it: all code under src (outside theme/) must be clean.
 * Paths are relative to frontend/src, with forward slashes.
 * @type {string[]}
 */
const LEGACY = [];

/** A hex colour that sits inside a quoted string or template on the same line. */
const HEX_IN_STRING = /(["'`])(?:(?!\1).)*?#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_])/;
/** rgb(/rgba(/hsl(/hsla( in any case with a numeric first channel: a literal, not a runtime build. */
const RGB_LITERAL = /\b(?:rgba?|hsla?)\(\s*[\d.]/i;
const EMOJI = /\p{Extended_Pictographic}/u;

function isSkipped(rel) {
  return (
    rel.startsWith("theme/") ||
    rel.startsWith("__tests__/") ||
    rel.includes("/__tests__/") ||
    /\.test\.tsx?$/.test(rel)
  );
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") walk(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Scans a src root. Returns { offenders: [{ file, line, kind, text }], staleLegacy: [] }.
 * `legacy` defaults to the LEGACY list; tests pass their own.
 */
function scan(srcRoot, { legacy = LEGACY } = {}) {
  const offenders = [];
  const legacySet = new Set(legacy);
  const legacyHits = new Set();
  for (const full of walk(srcRoot)) {
    const rel = path.relative(srcRoot, full).split(path.sep).join("/");
    if (isSkipped(rel)) continue;
    const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
    const inUi = rel.startsWith("ui/");
    const found = [];
    lines.forEach((text, i) => {
      if (HEX_IN_STRING.test(text)) found.push({ kind: "hex", line: i + 1, text });
      if (RGB_LITERAL.test(text)) found.push({ kind: "rgb", line: i + 1, text });
      if (inUi && EMOJI.test(text)) found.push({ kind: "emoji", line: i + 1, text });
    });
    if (found.length === 0) continue;
    if (legacySet.has(rel) && !inUi) {
      legacyHits.add(rel);
      continue;
    }
    for (const f of found) offenders.push({ file: rel, ...f });
  }
  const staleLegacy = legacy.filter((rel) => !legacyHits.has(rel));
  return { offenders, staleLegacy };
}

function main() {
  const srcRoot = path.resolve(__dirname, "..", "src");
  const { offenders, staleLegacy } = scan(srcRoot);
  for (const rel of staleLegacy) {
    console.warn(`check:tokens: LEGACY entry ${rel} is clean or gone; remove it from the list.`);
  }
  if (offenders.length > 0) {
    console.error("check:tokens: colour literals or emoji found (use frontend/src/theme tokens / Lucide icons):");
    for (const o of offenders) {
      console.error(`  src/${o.file}:${o.line}  [${o.kind}]  ${o.text.trim().slice(0, 120)}`);
    }
    process.exit(1);
  }
  console.log(`check:tokens: OK (${LEGACY.length - staleLegacy.length} legacy files allowlisted).`);
}

module.exports = { scan, LEGACY };

if (require.main === module) main();
