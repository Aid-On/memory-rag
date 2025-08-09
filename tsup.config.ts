import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to type issues with Vercel AI SDK tool function
  clean: true,
  sourcemap: true,
  minify: false,
  shims: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  target: 'node16',
  external: [
    'ai',
    '@ai-sdk/openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/google',
    '@ai-sdk/cohere',
    'zod'
  ]
});