import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

// The Node.js deployment of TanStack Start's hosting guide: the Nitro plugin
// with its default preset (node-server), which builds .output/server/index.mjs.
// /about is prerendered by Nitro during the build, so that the built server
// serves it as a file. (TanStack Start's own `prerender` option writes the
// page after Nitro has listed its public files, and the Node server then
// never serves it.)
//
// BENCH_VARIANT names a tuned form of the application (see prepare.mjs):
// `compressed-assets` turns on Nitro's compressPublicAssets, which writes
// compressed copies of the public files and the prerendered page during the
// build, and is built into a folder of its own.
const tuned = process.env.BENCH_VARIANT === 'compressed-assets' ? { compressPublicAssets: true, output: { dir: process.env.BENCH_OUTPUT } } : {}

export default defineConfig({
  plugins: [tanstackStart(), nitro({ prerender: { routes: ['/about'] }, ...tuned }), viteReact()],
})
