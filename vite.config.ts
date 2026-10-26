import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  // Dev only: the online ladder service (doc 27), started with
  //   LADDER_FILE=/tmp/ladder.json node --experimental-strip-types server/ladder/main.ts
  server: {
    proxy: { '/api/ladder': 'http://127.0.0.1:8090' },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
    // The asset modules list image folders with import.meta.glob at transform time; a cached transform keeps
    // an old file list when images are added or renamed (the module's own source is unchanged), so no disk cache.
    fsModuleCache: false,
  },
});
