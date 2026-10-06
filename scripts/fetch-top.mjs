// Fetch the top N packages of an ecosystem, most used first, into its
// packages.json (data/packages.json for npm, data/<ecosystem>/packages.json
// for the others). Only registry listings are read; nothing is installed.
// Usage: node scripts/fetch-top.mjs [N=100] [--ecosystem=npm|cargo|pypi|rubygems|gomod|jsr]
import { mkdir, writeFile } from 'node:fs/promises'
import { ecosystemFromArgs } from './lib/ecosystems.mjs'

const eco = ecosystemFromArgs()
const count = Number(process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 100)
if (!Number.isInteger(count) || count < 1) {
  console.error('Usage: node scripts/fetch-top.mjs [N] [--ecosystem=<id>]')
  process.exit(1)
}

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'package-efficiency-labels (categorization script)' } }).catch(() => null)
    if (res?.ok) return res.json()
    if (attempt === 6) throw new Error(`${url} -> ${res ? `HTTP ${res.status}` : 'no response'}`)
    await new Promise((r) => setTimeout(r, 3000 * attempt))
  }
}

const clean = (text) => (text ?? '').replace(/\s+/g, ' ').trim().slice(0, 300)

// Go publishes each major version as its own module (…/v2, gopkg.in/x.v3).
// They are one package here, listed once under its most used path.
const goFamily = (name) => name.replace(/\/v\d+$/, '').replace(/\.v\d+$/, '')

async function fromEcosystems() {
  const api = `https://packages.ecosyste.ms/api/v1/registries/${eco.registry}/packages`
  // Keep per_page constant across pages so page offsets line up.
  const perPage = Math.min(count, 1000)
  const packages = []
  const seen = new Set()
  for (let page = 1; packages.length < count; page++) {
    const rows = await getJson(`${api}?sort=${eco.sort}&order=desc&per_page=${perPage}&page=${page}`)
    if (rows.length === 0) break
    for (const row of rows) {
      const key = eco.id === 'gomod' ? goFamily(row.name) : row.name
      if (seen.has(key)) continue
      seen.add(key)
      packages.push({
        name: row.name,
        rank: packages.length + 1,
        ...(eco.sort === 'downloads' ? { downloads: row.downloads } : { dependents: row.dependent_repos_count }),
        version: row.latest_release_number,
        description: clean(row.description),
        keywords: (row.keywords_array ?? []).slice(0, 12),
        repository: row.repository_url ?? null,
      })
    }
    console.error(`fetched ${Math.min(packages.length, count)}/${count}`)
  }
  return packages
}

// Run `task` over `items`, a few at a time.
async function pooled(items, limit, task) {
  const results = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await task(items[i], i)
    }
  }))
  return results
}

// JSR has no listing ordered by use, and reports downloads only per package
// (its listing also leaves the dependent counts at zero). So the whole
// registry is listed, and every published package is asked for its downloads
// over the last 90 days: about 20,000 small requests, a few minutes.
async function fromJsr() {
  const first = await getJson('https://api.jsr.io/packages?limit=100&page=1')
  const pages = Array.from({ length: Math.ceil(first.total / 100) - 1 }, (_, i) => i + 2)
  const rest = await pooled(pages, 8, async (page) => (await getJson(`https://api.jsr.io/packages?limit=100&page=${page}`)).items)
  const all = [...new Map([...first.items, ...rest.flat()].map((p) => [`${p.scope}/${p.name}`, p])).values()]
  const candidates = all.filter((p) => p.latestVersion && !p.isArchived)
  console.error(`listed ${all.length} of ${first.total} JSR packages, ${candidates.length} published`)
  let done = 0
  const downloads = await pooled(candidates, 12, async (p) => {
    const { total } = await getJson(`https://api.jsr.io/scopes/${p.scope}/packages/${p.name}/downloads`)
    if (++done % 2000 === 0) console.error(`downloads for ${done}/${candidates.length}`)
    return total.reduce((sum, bucket) => sum + bucket.count, 0)
  })
  return candidates
    .map((p, i) => ({ ...p, downloads: downloads[i] }))
    .sort((a, b) => b.downloads - a.downloads || `${a.scope}/${a.name}`.localeCompare(`${b.scope}/${b.name}`))
    .map((p, i) => ({
      name: `@${p.scope}/${p.name}`,
      rank: i + 1,
      downloads: p.downloads,
      version: p.latestVersion,
      description: clean(p.description),
      keywords: [],
      repository: p.githubRepository ? `https://github.com/${p.githubRepository.owner}/${p.githubRepository.name}` : null,
    }))
}

const packages = eco.id === 'jsr' ? await fromJsr() : await fromEcosystems()
packages.length = Math.min(packages.length, count)

await mkdir(eco.dir, { recursive: true })
await writeFile(eco.packages, JSON.stringify(packages, null, 2) + '\n')
console.log(`wrote ${eco.packages} (${packages.length} packages, ranked by ${eco.popularity})`)
