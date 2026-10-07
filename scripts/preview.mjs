// The built site on this computer, at http://localhost:4173 (or --port=N).
// It answers the way the published site does: a built file when there is
// one, otherwise site/worker.mjs, the same code Cloudflare runs, for the
// pages that are packed in dist/lazy/ and for addresses that do not exist.
// (`npx wrangler dev` runs the real Cloudflare runtime locally instead.)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import worker from '../site/worker.mjs'
import { fromRoot } from './lib/util.mjs'

const port = Number(process.argv.find((a) => a.startsWith('--port='))?.slice(7) ?? 4173)
const dist = fromRoot('dist')
const TYPES = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8', json: 'application/json', svg: 'image/svg+xml', md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8', csv: 'text/csv; charset=utf-8', png: 'image/png' }

// A built file for an address, or null. Stays inside dist.
async function built(pathname) {
  let relative
  try { relative = decodeURIComponent(pathname) } catch { return null }
  const file = path.join(dist, relative)
  if (file !== dist && !file.startsWith(dist + path.sep)) return null
  const found = await stat(file).catch(() => null)
  if (found?.isFile()) return { file }
  if (found?.isDirectory()) {
    if (!pathname.endsWith('/')) return (await stat(path.join(file, 'index.html')).catch(() => null)) ? { redirect: `${pathname}/` } : null
    const index = path.join(file, 'index.html')
    if (await stat(index).catch(() => null)) return { file: index }
  }
  return null
}
const fileResponse = async (file) => new Response(await readFile(file), { headers: { 'content-type': TYPES[path.extname(file).slice(1)] ?? 'application/octet-stream' } })
const env = {
  ASSETS: {
    async fetch(url) {
      const hit = await built(new URL(url).pathname)
      return hit?.file ? fileResponse(hit.file) : new Response('Not found', { status: 404 })
    },
  },
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host ?? `localhost:${port}`}`)
    const hit = await built(url.pathname)
    const answer = hit?.redirect ? Response.redirect(new URL(hit.redirect + url.search, url), 307)
      : hit?.file ? await fileResponse(hit.file)
      : await worker.fetch(new Request(url, { method: request.method }), env)
    response.writeHead(answer.status, Object.fromEntries(answer.headers))
    response.end(request.method === 'HEAD' ? undefined : Buffer.from(await answer.arrayBuffer()))
  } catch (error) {
    response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
    response.end(String(error?.stack ?? error))
  }
}).listen(port, () => console.error(`http://localhost:${port}`))
