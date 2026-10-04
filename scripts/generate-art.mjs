#!/usr/bin/env node
/**
 * The art pipeline (ADR-0011). Reads art/manifest.json and, for every item
 * whose PNG is missing or whose recipe changed, asks fal for an image, then
 * snaps it to true pixel art — downscaled to the item's grid and quantised
 * to a small palette — and writes public/art/<id>.png. art/lock.json keeps
 * a hash of each recipe so unchanged items are never paid for twice.
 *
 *   FAL_KEY=… node scripts/generate-art.mjs [id …]
 *
 * Naming ids regenerates just those. The key comes from the owner's shell
 * only; CI and the Worker never call fal.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'art', 'manifest.json');
const LOCK = path.join(ROOT, 'art', 'lock.json');
const OUT = path.join(ROOT, 'public', 'art');
/** The full-size originals, kept locally (gitignored) for inspection and re-pixelating. */
const RAW = path.join(ROOT, 'art', 'raw');

function fail(message) {
  console.error(message);
  process.exit(1);
}

function recipeHash(manifest, item) {
  const recipe = { model: manifest.model, style: manifest.style, ...item };
  return createHash('sha256').update(JSON.stringify(recipe)).digest('hex').slice(0, 16);
}

async function generate(manifest, item, key) {
  const [width, height] = item.generate;
  const res = await fetch(`https://fal.run/${manifest.model}`, {
    method: 'POST',
    headers: { authorization: `Key ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      prompt: `${item.prompt}. ${manifest.style}`,
      image_size: { width, height },
      seed: item.seed,
      num_images: 1,
      output_format: 'png',
      enable_safety_checker: true,
    }),
  });
  if (!res.ok) throw new Error(`fal answered ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const url = body.images?.[0]?.url;
  if (!url) throw new Error(`fal returned no image for ${item.id}`);
  const image = await fetch(url);
  if (!image.ok) throw new Error(`could not download ${item.id}: ${image.status}`);
  return Buffer.from(await image.arrayBuffer());
}

/** Downscale to the item's grid, then quantise to its palette with no dithering. */
async function pixelate(raw, item) {
  const [width, height] = item.size;
  return sharp(raw)
    .resize(width, height, { fit: 'cover', kernel: 'lanczos3' })
    .png({ palette: true, colours: item.colours, dither: 0 })
    .toBuffer();
}

const key = process.env.FAL_KEY;
if (!key) fail('FAL_KEY is not set — export it in your shell (ADR-0011).');

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};
const only = new Set(process.argv.slice(2));
mkdirSync(OUT, { recursive: true });
mkdirSync(RAW, { recursive: true });

let made = 0;
for (const item of manifest.items) {
  const file = path.join(OUT, `${item.id}.png`);
  const hash = recipeHash(manifest, item);
  const wanted = only.size > 0 ? only.has(item.id) : lock[item.id] !== hash || !existsSync(file);
  if (!wanted) continue;
  process.stdout.write(`${item.id} … `);
  const raw = await generate(manifest, item, key);
  writeFileSync(path.join(RAW, `${item.id}.png`), raw);
  const png = await pixelate(raw, item);
  writeFileSync(file, png);
  lock[item.id] = hash;
  writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
  made += 1;
  console.log(`${item.size.join('×')} px`);
}
console.log(made === 0 ? 'All art is up to date.' : `Generated ${made} image(s).`);
