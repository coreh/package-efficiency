// Merge the workflow's batch outputs into data/categories.json, validate them
// against data/taxonomy.json, and write a readable report to data/categories.md.
// Usage: node scripts/merge-categories.mjs [--ecosystem=<id>]
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { ecosystemFromArgs } from './lib/ecosystems.mjs'

const eco = ecosystemFromArgs()

const readJson = async (path, fallback) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback
    throw err
  }
}

const packages = await readJson(eco.packages)
const taxonomy = await readJson('data/taxonomy.json')
const categories = await readJson(eco.categories, {})

const known = new Set(packages.map((p) => p.name))
const validIds = new Set(taxonomy.categories.map((c) => c.id))
const problems = []

const outDir = `${eco.batches}/out`
const outFiles = (await readdir(outDir).catch(() => [])).filter((f) => f.endsWith('.json')).sort()
for (const file of outFiles) {
  let rows
  try {
    rows = JSON.parse(await readFile(`${outDir}/${file}`, 'utf8'))
  } catch (err) {
    problems.push(`${file}: unreadable (${err.message})`)
    continue
  }
  for (const row of rows) {
    if (!known.has(row.name)) {
      problems.push(`${file}: unknown package "${row.name}"`)
    } else if (!validIds.has(row.category)) {
      problems.push(`${file}: ${row.name} has unknown category "${row.category}"`)
    } else {
      categories[row.name] = {
        category: row.category,
        confidence: row.confidence === 'low' ? 'low' : 'high',
        ...(row.note ? { note: row.note } : {}),
      }
    }
  }
}

const sorted = Object.fromEntries(Object.entries(categories).sort(([a], [b]) => a.localeCompare(b)))
await writeFile(eco.categories, JSON.stringify(sorted, null, 2) + '\n')

const missing = packages.filter((p) => !categories[p.name]).map((p) => p.name)
const byCategory = new Map(taxonomy.categories.map((c) => [c.id, []]))
for (const p of packages) {
  const entry = categories[p.name]
  if (entry) byCategory.get(entry.category)?.push(p)
}

const fmt = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : `${Math.round(n / 1e6)}M`)
// Ecosystems without download counts are ranked by dependents instead.
const popularity = (p) => (p.downloads == null ? `${p.dependents.toLocaleString('en-US')} dependents` : `${fmt(p.downloads)} ${eco.popularity.replace('downloads ', '')}`)
const sections = taxonomy.categories
  .map((c) => ({ ...c, members: byCategory.get(c.id) }))
  .filter((c) => c.members.length > 0)
  .sort((a, b) => b.members.length - a.members.length)

const md = [
  `# Package categories: ${eco.title}`,
  ``,
  `${packages.length - missing.length} of ${packages.length} packages categorized into ${sections.length} categories.`,
  ``,
  `| Category | Packages | Benchmarkable | Candidate benchmark |`,
  `| --- | ---: | --- | --- |`,
  ...sections.map(
    (c) => `| ${c.title} (\`${c.id}\`) | ${c.members.length} | ${c.benchmarkable ? 'yes' : 'no'} | ${c.benchmarkIdea ?? ''} |`,
  ),
  ``,
  ...sections.flatMap((c) => [
    `## ${c.title}`,
    ``,
    c.description,
    ``,
    ...c.members.map((p) => {
      const e = categories[p.name]
      const flag = e.confidence === 'low' ? ` (low confidence${e.note ? `: ${e.note}` : ''})` : ''
      return `- \`${p.name}\` #${p.rank}, ${popularity(p)}${flag}`
    }),
    ``,
  ]),
].join('\n')
await writeFile(eco.report, md)

console.log(
  JSON.stringify(
    {
      ecosystem: eco.id,
      categorized: packages.length - missing.length,
      total: packages.length,
      categories: sections.map((c) => ({ id: c.id, count: c.members.length, benchmarkable: c.benchmarkable })),
      lowConfidence: packages.filter((p) => categories[p.name]?.confidence === 'low').map((p) => p.name),
      missing,
      problems,
    },
    null,
    2,
  ),
)
