// Astro with the Node adapter in standalone mode, as its deployment guide
// says to run on Node. Pages are prerendered by default; the routes that need
// a request say `prerender = false`.
import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  telemetry: false,
})
