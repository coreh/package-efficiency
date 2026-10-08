// Serves the pages that have no file of their own. Cloudflare answers from
// the built files first and calls this only when there is none: for a package
// that is listed but not measured yet, whose page the build packed into
// dist/lazy/ (see site/lazy.mjs), and for addresses that do not exist.
import { embedShardOf, shardOf } from './lazy.mjs'

const asset = (env, url, path) => env.ASSETS.fetch(new URL(path, url))

// A packed page: [before the sidebar, sidebar id, after the sidebar, Markdown].
async function packed(env, url, address) {
  const response = await asset(env, url, `/lazy/pages/${shardOf(address)}.json`)
  if (!response.ok) return null
  return (await response.json())[address] ?? null
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 })
    let path = url.pathname
    // decodeURI leaves an escaped @ alone, and the sitemap and some clients
    // write a scoped package's address that way.
    try { path = decodeURI(path).replace(/%40/gi, '@') } catch {}
    // A short link to a result: its code at the root, as labels print it, or
    // after /r/, as they did at first. Built pages are answered before this
    // Worker runs, so a code cannot hide one.
    const short = /^\/(?:r\/)?([0-9a-z]{6,40})\/?$/.exec(path)
    if (short) {
      const links = await asset(env, url, '/lazy/short.json')
      const to = links.ok ? (await links.json())[short[1]] : null
      if (to) return Response.redirect(new URL(encodeURI(to), url), 308)
    }
    // A label as a file, or an embeddable shape of one, from its pack.
    if ((path.startsWith('/embed/') || path.startsWith('/labels/')) && path.endsWith('.svg')) {
      const pack = await asset(env, url, `/lazy/embed/${embedShardOf(path)}.json`)
      const svg = pack.ok ? (await pack.json())[path] : null
      if (svg) return new Response(svg, { headers: { 'cache-control': 'public, max-age=300', 'content-type': 'image/svg+xml' } })
    }
    const markdown = path.endsWith('/index.md')
    const address = markdown ? path.slice(0, -'index.md'.length) : path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path.endsWith('/') ? path : `${path}/`
    const page = await packed(env, url, address)
    if (page) {
      const headers = { 'cache-control': 'public, max-age=300' }
      if (markdown) return new Response(page[3], { headers: { ...headers, 'content-type': 'text/markdown; charset=utf-8' } })
      // Like the built pages, a page lives at the address ending in a slash.
      if (path !== address) return Response.redirect(new URL(`${encodeURI(address)}${url.search}`, url), 308)
      const sidebar = await (await asset(env, url, `/lazy/side/${page[1]}.txt`)).text()
      return new Response(page[0] + sidebar + page[2], { headers: { ...headers, 'content-type': 'text/html; charset=utf-8' } })
    }
    const missing = await asset(env, url, '/lazy/not-found.txt')
    return new Response(missing.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8' } })
  },
}
