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

/**
 * Mars Patrol 3D (ADR-0018): the games are shiny and full-resolution, so this
 * block carries physically based colours and the render's knobs — exposure,
 * bloom, fog — instead of toon bands.
 */
export const MARS = {
  skyTop: 0x150b2a,
  skyMid: 0x6a2f5a,
  skyHorizon: 0xf08a5a,
  sunDisc: 0xffe2b8,
  sunLight: 0xffc9a0,
  hemiSky: 0xc48aa0,
  hemiGround: 0x5a2416,
  fog: 0xc8785a,
  dust: 0xcc6a3e,
  dustDark: 0x8e3a20,
  dustLight: 0xe39a68,
  craterFloor: 0x5a2014,
  pebble: 0x7a3826,
  mesa: 0xa84e30,
  mesaFar: 0xc07454,
  mountain: 0xd29274,
  phobos: 0xcfc0b0,
  deimos: 0xa89482,
  star: 0xfff6ea,
  dome: 0x9fb4c8,
  domeGlow: 0x6ff6ff,
  hull: 0xd9dee6,
  hullAccent: 0x24c8ff,
  chassis: 0x2a2e38,
  glass: 0x0e1a28,
  tyre: 0x17171b,
  rim: 0xc8ccd6,
  headlight: 0xfff4d0,
  beacon: 0xff3b5c,
  muzzle: 0x3a3f4a,
  flash: 0xfff1a0,
  shot: 0x8ff8ff,
  fire: 0xffa040,
  spark: 0xffe088,
  smoke: 0x3a2a2a,
  ufoHull: 0xa4aec0,
  ufoGlow: 0xff3bd0,
  ufoDome: 0x7ff0ff,
  bomb: 0x2c2c36,
  bombGlow: 0xff5040,
  shadow: 0x000000,
  untinted: 0xffffff,
} as const;

/** The game's render knobs. */
export const MARS_LOOK = {
  exposure: 0.95,
  maxPixelRatio: 2,
  fov: 32,
  fogNear: 70,
  fogFar: 520,
  bloom: { strength: 0.55, radius: 0.4, threshold: 0.92 },
  shadowMapSize: 2048,
  /** How much of the room environment shows in reflections. */
  environment: 0.35,
} as const;

/** Colours painted on the game's HUD canvas, as CSS strings. */
export const MARS_INK = {
  text: '#fff4e6',
  accent: '#5ff2ff',
  warm: '#ffb36b',
  dim: 'rgba(255, 244, 230, 0.45)',
  glow: '#ff8a4a',
  backdrop: 'rgba(10, 6, 20, 0.35)',
} as const;

/** The HUD's typeface, sized by the painter. */
export const MARS_FONT = '"Avenir Next", "Futura", "Segoe UI", system-ui, sans-serif';
