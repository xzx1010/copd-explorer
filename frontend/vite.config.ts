import { readFile, writeFile } from 'node:fs/promises'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Set VITE_BASE_PATH for repository-hosted deployments such as GitHub Pages.
  base: process.env.VITE_BASE_PATH ?? '/',
  build: {
    // GitHub Pages needs a fallback for BrowserRouter deep links.
    rollupOptions: {
      plugins: [
        {
          name: 'spa-404-fallback',
          async writeBundle(options) {
            const outputDir = options.dir ?? 'dist'
            const indexHtml = await readFile(`${outputDir}/index.html`, 'utf8')
            await writeFile(`${outputDir}/404.html`, indexHtml)
          },
        },
      ],
    },
  },
})
