import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts', 'src/**/*.test.ts', 'worker/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      // The measured set (ADR-0008): the logic core. Every pure rule in
      // shared/, the whole Worker except its entry point, and src/core/ —
      // input, movement, the hall, the game contract — and every game's
      // core/ (ADR-0019). Rendering (src/render/, a game's render/)
      // and the entry point are wiring over Three.js and the DOM; they are
      // checked by the boot smoke test and screenshots, not by this ratchet.
      include: ['shared/**/*.ts', 'worker/**/*.ts', 'src/core/**/*.ts', 'src/games/*/core/**/*.ts'],
      exclude: ['**/*.test.*', '**/test/**', '**/*.d.ts', 'shared/types.ts', 'worker/index.ts'],
      // Ratchets: never lowered without a superseding ADR.
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
