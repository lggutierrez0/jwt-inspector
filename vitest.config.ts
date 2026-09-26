import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({
  // WxtVitest wires the WXT aliases, auto-imports and an in-memory `browser` (fakeBrowser).
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
    // Deterministic dates: every formatted time in tests is UTC.
    env: { TZ: 'UTC' },
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/entrypoints/**', 'src/locales/**'],
      thresholds: {
        // Domain logic is pure and security-relevant: held to a higher bar.
        'src/domain/**': { lines: 90, branches: 90, functions: 90, statements: 90 },
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
