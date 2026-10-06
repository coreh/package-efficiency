// Refresh how much each listed package is used, without changing which
// packages are listed: downloads (or dependents, for Go modules), the latest
// version and the rank within the ecosystem. Use fetch-top.mjs instead to
// rebuild a list from scratch, which also brings in packages that are new to
// the top N and need categorizing.
// Usage: node scripts/update-popularity.mjs [--ecosystem=<id>]   (all when absent)
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { fromRoot, readJson, writeJson } from './lib/util.mjs'

const only = process.argv.slice(2).find((a) => a.startsWith('--ecosystem='))?.split('=')[1]

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': 'package-efficiency-labels (popularity refresh)' } }).catch(() => null)
    if (res?.ok) return res.json()
    if (res?.status === 404) return null
    if (attempt === 6) throw new Error(`${url} -> ${res ? `HTTP ${res.status}` : 'no response'}`)
    await new Promise((r) => setTimeout(r, 3000 * attempt))
  }
}

async function pooled(items, limit, task) {
  let next = 0
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) await task(items[next++])
  }))
}

// The registry index lists packages most used first; two pages cover nearly
// every listed package, and the few that have slipped further are looked up
// one by one.
async function fromIndex(eco, packages) {
  const api = `https://packages.ecosyste.ms/api/v1/registries/${eco.registry}/packages`
  const rows = new Map()
  for (const page of [1, 2]) {
    for (const row of (await getJson(`${api}?sort=${eco.sort}&order=desc&per_page=1000&page=${page}`)) ?? []) rows.set(row.name, row)
  }
  const missing = packages.filter((p) => !rows.has(p.name))
  await pooled(missing, 2, async (p) => {
    const row = await getJson(`${api}/${encodeURIComponent(p.name)}`)
    if (row) rows.set(p.name, row)
  })
  const field = eco.sort === 'downloads' ? 'downloads' : 'dependents'
  let updated = 0
  for (const p of packages) {
    const row = rows.get(p.name)
    const value = row && (field === 'downloads' ? row.downloads : row.dependent_repos_count)
    if (value == null) continue
    p[field] = value
    if (row.latest_release_number) p.version = row.latest_release_number
    updated++
  }
  return { field, updated }
}

async function fromJsr(packages) {
  let updated = 0
  await pooled(packages, 12, async (p) => {
    const [, scope, name] = /^@([^/]+)\/(.+)$/.exec(p.name)
    const [downloads, details] = await Promise.all([getJson(`https://api.jsr.io/scopes/${scope}/packages/${name}/downloads`), getJson(`https://api.jsr.io/scopes/${scope}/packages/${name}`)])
    if (!downloads) return
    p.downloads = downloads.total.reduce((sum, bucket) => sum + bucket.count, 0)
    if (details?.latestVersion) p.version = details.latestVersion
    updated++
  })
  return { field: 'downloads', updated }
}

const stamps = await readJson(fromRoot('data/popularity.json'), {})
for (const id of only ? [only] : ecosystemIds) {
  const eco = ecosystem(id)
  const packages = await readJson(fromRoot(eco.packages), null)
  if (!packages) continue
  const { field, updated } = id === 'jsr' ? await fromJsr(packages) : await fromIndex(eco, packages)
  packages.sort((a, b) => (b[field] ?? 0) - (a[field] ?? 0) || a.rank - b.rank)
  packages.forEach((p, i) => (p.rank = i + 1))
  await writeJson(fromRoot(eco.packages), packages)
  stamps[id] = { updatedAt: new Date().toISOString().slice(0, 10), measure: eco.popularity }
  console.log(`${eco.title}: ${updated} of ${packages.length} refreshed (${eco.popularity})`)
}
await writeJson(fromRoot('data/popularity.json'), stamps)
