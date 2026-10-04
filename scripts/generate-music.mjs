#!/usr/bin/env node
/**
 * The music pipeline (ADR-0015). Reads art/music.json and, for every track
 * whose MP3 is missing or whose recipe changed, asks fal's Lyria for it and
 * writes public/music/<id>.mp3. Recipe hashes share art/lock.json with the
 * art (keys prefixed `music:`), so nothing is paid for twice.
 *
 *   FAL_KEY=… node scripts/generate-music.mjs [id …]
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECIPES = path.join(ROOT, 'art', 'music.json');
const LOCK = path.join(ROOT, 'art', 'lock.json');
const OUT = path.join(ROOT, 'public', 'music');

const key = process.env.FAL_KEY;
if (!key) {
  console.error('FAL_KEY is not set — export it in your shell (ADR-0011).');
  process.exit(1);
}

const recipes = JSON.parse(readFileSync(RECIPES, 'utf8'));
const lock = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, 'utf8')) : {};
const only = new Set(process.argv.slice(2));
mkdirSync(OUT, { recursive: true });

for (const item of recipes.items) {
  const file = path.join(OUT, `${item.id}.mp3`);
  const hash = createHash('sha256')
    .update(JSON.stringify({ model: recipes.model, ...item }))
    .digest('hex')
    .slice(0, 16);
  const lockKey = `music:${item.id}`;
  const wanted = only.size > 0 ? only.has(item.id) : lock[lockKey] !== hash || !existsSync(file);
  if (!wanted) continue;
  process.stdout.write(`${item.id} … `);
  const res = await fetch(`https://fal.run/${recipes.model}`, {
    method: 'POST',
    headers: { authorization: `Key ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prompt: item.prompt }),
  });
  if (!res.ok) throw new Error(`fal answered ${res.status}: ${await res.text()}`);
  const url = (await res.json()).audio?.url;
  if (!url) throw new Error(`fal returned no audio for ${item.id}`);
  const audio = await fetch(url);
  if (!audio.ok) throw new Error(`could not download ${item.id}: ${audio.status}`);
  const bytes = Buffer.from(await audio.arrayBuffer());
  writeFileSync(file, bytes);
  lock[lockKey] = hash;
  writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`${Math.round(bytes.length / 1024)} KB`);
}
