import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'bin',
    ssr: true,
    lib: {
      formats: ['es'],
      entry: './lib/main.ts',
      name: 'main',
      fileName: 'main'
    },
    rollupOptions: {
      external: ['commander', 'inquirer'],
      output: {
        banner: '#!/usr/bin/env node'
      }
    }
  }
})
