// Next's defaults. Only the project root is stated, because the work folder
// sits inside another project and Next would otherwise guess from lockfiles.
//
// BENCH_VARIANT names a tuned form of the application (see prepare.mjs):
// `no-compress` turns off Next's own gzip, as its documentation says to do
// when a proxy in front compresses, and is built into a folder of its own.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const noCompress = process.env.BENCH_VARIANT === 'no-compress'

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: here },
  outputFileTracingRoot: here,
  ...(noCompress ? { compress: false, distDir: '.next-no-compress' } : {}),
}

export default nextConfig
