import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'demo/',
        '*.config.ts',
        '*.config.mjs',
        '*.config.js',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types/**',
        'vite.config.mjs',
        'vitest.config.ts',
        'tsup.config.ts'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        // vitest 4 の v8 カバレッジは AST ベースで分岐を数える（デフォルト引数等も分岐扱い）ため、
        // vitest 2 時代（91%）と同じテストでも約 66% と算出される。計測方式の変更に合わせて調整。
        branches: 65,
        statements: 80
      }
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'demo']
  }
});