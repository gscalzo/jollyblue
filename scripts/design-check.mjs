/**
 * Design-system gate (ADR-0002). Two files are the only source of the look:
 *   - src/styles.css — colour, type, geometry and motion of the DOM overlays
 *   - src/palette.ts — the scene's colours and the render's look knobs
 * Everywhere else under src/, these are banned:
 *   - raw colours (#hex, rgb()/rgba(), hsl()/hsla(), 0xRRGGBB literals)
 *   - gradients, font-family/fontFamily and @keyframes
 *   - a border-radius, box-shadow, text-shadow, transition or animation
 *     whose value is literal rather than a var(--*) token
 * Exit 1 with file:line findings when anything matches.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const TOKEN_FILES = new Set([join(SRC, 'styles.css'), join(SRC, 'palette.ts')]);

const MOTION_PROP = /(?:^|[^-\w])(?:transition|animation)\s*:\s*([^;}]+)/;

const BANNED = [
  { re: /#[0-9a-fA-F]{3,8}\b/, why: 'raw colour — use a token' },
  { re: /\b(?:rgb|rgba|hsl|hsla)\s*\(/, why: 'raw colour — use a token' },
  { re: /\b0x[0-9a-fA-F]{6}\b/, why: 'raw scene colour — add it to src/palette.ts' },
  { re: /(?:linear|radial|conic)-gradient/, why: 'gradients live only in styles.css' },
  { re: /font-family|fontFamily/, why: 'type is defined once in styles.css' },
  {
    re: /(?:border-radius|borderRadius)\s*:\s*(?!.*var\(--)[^;}]*[1-9]/,
    why: 'raw radius — use var(--radius-*)',
  },
  {
    re: /(?:box-shadow|boxShadow|text-shadow|textShadow)\s*:\s*(?!.*var\(--)[^;}]*[1-9]/,
    why: 'raw shadow — use var(--shadow-*)',
  },
  { re: /@keyframes/, why: 'keyframes live only in styles.css' },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(?:css|ts)$/.test(name) && !/\.test\.ts$/.test(name)) yield path;
  }
}

function motionFinding(line) {
  const m = MOTION_PROP.exec(line);
  if (!m) return null;
  return m[1].includes('var(--') ? null : 'raw motion — use var(--motion-*)';
}

function checkFile(path) {
  const findings = [];
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const at = `${relative(ROOT, path)}:${i + 1}`;
      const reasons = BANNED.filter(({ re }) => re.test(line)).map((b) => b.why);
      const motion = motionFinding(line);
      if (motion !== null) reasons.push(motion);
      for (const why of reasons) findings.push(`${at}  ${why}\n    ${line.trim()}`);
    });
  return findings;
}

const findings = [];
for (const path of walk(SRC)) {
  if (TOKEN_FILES.has(path)) continue;
  findings.push(...checkFile(path));
}

if (findings.length > 0) {
  console.error(`design-check: ${findings.length} violation(s)\n`);
  for (const f of findings) console.error(f);
  process.exit(1);
}
console.log('design-check passed — the look flows from src/styles.css and src/palette.ts.');
