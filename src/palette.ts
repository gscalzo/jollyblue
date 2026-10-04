/**
 * The scene's design tokens (ADR-0002): every colour the hall paints and
 * every knob of the low-resolution toon look. scripts/design-check.mjs
 * rejects a raw colour anywhere else under src/.
 */

/** Scene colours, as 0xRRGGBB for Three.js. */
export const SCENE = {
  night: 0x120d24,
  wall: 0x3a2b5c,
  wallTrim: 0x221838,
  skirting: 0x4b3a78,
  neonPink: 0xff5fa2,
  neonCyan: 0x5ff2ff,
  neonAmber: 0xffc35f,
  ambient: 0x8a7ab8,
  moon: 0xfff0d8,
  screenOff: 0x0b0a14,
  highlight: 0xfff27a,
  skin: 0xf2c49b,
  hoodie: 0x3fa9f5,
  hoodieDark: 0x2a76b0,
  trousers: 0x2b2440,
  shoes: 0xf4e9d8,
  /** White: shows a texture's own colours. */
  untinted: 0xffffff,
  /** Darkens the carpet art so the cabinets stay the brightest things in the room. */
  carpetTint: 0x8a7fa8,
} as const;

/** The cabinet liveries, one per cabinet colour scheme. */
export const LIVERIES = {
  cobalt: { body: 0x2f4fd8, trim: 0x9fb4ff },
  cherry: { body: 0xd8344f, trim: 0xffb0bd },
  lime: { body: 0x4fbf3a, trim: 0xd4ffb0 },
  tangerine: { body: 0xf08a24, trim: 0xffd9a8 },
  grape: { body: 0x7a3fd8, trim: 0xd9c2ff },
  teal: { body: 0x1fa5a0, trim: 0xb0fff8 },
  midnight: { body: 0x23234a, trim: 0x8f8fff },
  bubblegum: { body: 0xf06ab8, trim: 0xffd0ea },
} as const;

export type Livery = keyof typeof LIVERIES;

/** Colours painted onto canvases (cabinet screens and marquees), as CSS strings. */
export const INK = {
  screenBlack: '#07060f',
  phosphor: '#9dff8a',
  amber: '#ffc35f',
  pink: '#ff5fa2',
  cyan: '#5ff2ff',
  white: '#f4e9d8',
  dim: '#5b4f86',
  carpet: '#2e2350',
  marqueeGlow: '#fff6e0',
} as const;

/** The A Short Hike look: how coarse the pixels are and how many light bands. */
export const LOOK = {
  /** Window pixels per render pixel. */
  pixelScale: 3,
  /** Toon shading bands, darkest to brightest (0..255). */
  toonBands: [70, 150, 255],
  /** World units visible from the bottom to the top of the screen. */
  viewHeight: 9,
} as const;

/** Type painted onto canvases: a tiny monospace, upscaled in hard pixels. */
export const TYPE = {
  marquee: 'bold 10px ui-monospace, Menlo, monospace',
  screen: 'bold 7px ui-monospace, Menlo, monospace',
} as const;
