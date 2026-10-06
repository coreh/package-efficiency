// Split the packages that still need a category into batch files for the
// categorization workflow. Prints a JSON summary the workflow takes as args.
// Usage: node scripts/prepare-batches.mjs [--batch-size=50] [--all] [--ecosystem=<id>]
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { ecosystemFromArgs } from './lib/ecosystems.mjs'

const eco = ecosystemFromArgs()

const flags = process.argv.slice(2)
const batchSize = Number(flags.find((f) => f.startsWith('--batch-size='))?.split('=')[1] ?? 50)
const recategorizeAll = flags.includes('--all')

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT') return fallback
    throw err
  }
}

const packages = await readJson(eco.packages, null)
if (!packages) {
  console.error(`${eco.packages} not found; run scripts/fetch-top.mjs first`)
  process.exit(1)
}
const done = recategorizeAll ? {} : await readJson(eco.categories, {})
// "other" means "no peers yet", so retry those whenever the package set grows.
const pending = packages.filter((p) => !done[p.name] || done[p.name].category === 'other')

// One line per package: cheap for an agent to read in full.
const line = (p) => [p.name, p.description, p.keywords.join(',')].join('\t')

await rm(eco.batches, { recursive: true, force: true })
await mkdir(`${eco.batches}/out`, { recursive: true })
await writeFile(eco.packagesTsv, packages.map(line).join('\n') + '\n')

let batchCount = 0
for (let i = 0; i < pending.length; i += batchSize) {
  const batch = pending.slice(i, i + batchSize)
  await writeFile(`${eco.batches}/batch-${batchCount}.tsv`, batch.map(line).join('\n') + '\n')
  batchCount++
}

console.log(JSON.stringify({ ecosystem: eco.id, title: eco.title, dir: eco.dir, total: packages.length, pending: pending.length, batchCount }))
