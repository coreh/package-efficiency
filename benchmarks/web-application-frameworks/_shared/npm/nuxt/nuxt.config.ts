// Nuxt's defaults (server rendering, the Nitro node-server preset) with the
// one page that is the same for every visitor prerendered at build time, and
// telemetry off.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  telemetry: false,
  routeRules: { '/about': { prerender: true } },
})
