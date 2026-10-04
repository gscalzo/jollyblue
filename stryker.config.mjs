/**
 * Mutation testing (ADR-0008). The logic core only: the same modules the
 * coverage gate holds to its ratchet — rendering and the entry points are
 * not mutated. String-literal mutants are off: killing them means asserting
 * copy verbatim, which couples tests to wording instead of behaviour.
 * `break: 100` fails the run when any mutant survives.
 */
export default {
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  mutator: { excludedMutations: ['StringLiteral'] },
  reporters: ['html', 'json', 'clear-text', 'progress'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  mutate: [
    'shared/**/*.ts',
    'worker/**/*.ts',
    'src/core/**/*.ts',
    '!**/*.test.ts',
    '!**/*.d.ts',
    '!shared/types.ts',
    '!worker/index.ts',
    '!worker/test/**',
  ],
  vitest: { configFile: 'vitest.config.ts' },
  thresholds: { high: 100, low: 100, break: 100 },
};
