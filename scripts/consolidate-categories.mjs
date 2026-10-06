// Fold redundant categories into the ones that should hold their packages.
// Takes a JSON file of merges, [{ "from": "<id>", "into": "<id>" }, ...], and
// applies them everywhere a category id is recorded: the taxonomy, every
// ecosystem's categorization, the measured categories under benchmarks/, and
// the category drawings. Packages keep their place; only the id changes.
// Usage: node scripts/consolidate-categories.mjs <merges.json> [--dry-run]
import { existsSync } from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { fromRoot, readJson, writeJson } from './lib/util.mjs'

const [file] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const dryRun = process.argv.includes('--dry-run')
if (!file) {
  console.error('Usage: node scripts/consolidate-categories.mjs <merges.json> [--dry-run]')
  process.exit(1)
}

const merges = await readJson(file)
const taxonomy = await readJson(fromRoot('data/taxonomy.json'))
const ids = new Set(taxonomy.categories.map((c) => c.id))
const into = new Map()
for (const { from, into: target } of merges) {
  if (!ids.has(from)) throw new Error(`unknown category "${from}"`)
  if (!ids.has(target)) throw new Error(`unknown category "${target}"`)
  if (from === target || from === 'other') throw new Error(`cannot merge "${from}" into "${target}"`)
  into.set(from, target)
}
// A merge into a category that is itself merged away follows the chain.
const resolve = (id) => {
  for (let hops = 0; into.has(id); hops++) {
    if (hops > into.size) throw new Error(`merges form a loop at "${id}"`)
    id = into.get(id)
  }
  return id
}

const report = { merged: [...into.keys()].map((from) => `${from} -> ${resolve(from)}`), moved: {}, measured: [], drawings: [] }

// The surviving category takes over the examples of the ones folded into it.
for (const category of taxonomy.categories) {
  if (!into.has(category.id)) continue
  const target = taxonomy.categories.find((c) => c.id === resolve(category.id))
  target.examples = [...new Set([...(target.examples ?? []), ...(category.examples ?? [])])].slice(0, 6)
}
taxonomy.categories = taxonomy.categories.filter((c) => !into.has(c.id))
if (taxonomy.candidateCategories) taxonomy.candidateCategories = taxonomy.candidateCategories.filter((c) => !into.has(c.id))
if (!dryRun) await writeJson(fromRoot('data/taxonomy.json'), taxonomy)

for (const id of ecosystemIds) {
  const path = fromRoot(ecosystem(id).categories)
  if (!existsSync(path)) continue
  const assigned = await readJson(path)
  let moved = 0
  for (const entry of Object.values(assigned)) {
    if (!into.has(entry.category)) continue
    entry.category = resolve(entry.category)
    moved++
  }
  report.moved[id] = moved
  if (moved && !dryRun) await writeJson(path, assigned)
}

for (const dir of await readdir(fromRoot('benchmarks'), { withFileTypes: true })) {
  const path = fromRoot('benchmarks', dir.name, 'category.json')
  if (!dir.isDirectory() || !existsSync(path)) continue
  const category = await readJson(path)
  if (!into.has(category.taxonomy)) continue
  report.measured.push(`${dir.name}: ${category.taxonomy} -> ${resolve(category.taxonomy)}`)
  category.taxonomy = resolve(category.taxonomy)
  if (!dryRun) await writeJson(path, category)
}

for (const from of into.keys()) {
  const drawing = fromRoot('site/assets/categories', `${from}.svg`)
  if (!existsSync(drawing)) continue
  report.drawings.push(`${from}.svg removed`)
  if (!dryRun) await rm(drawing)
}

console.log(JSON.stringify({ dryRun, ...report }, null, 2))
