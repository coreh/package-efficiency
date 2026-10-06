// Render the static site into dist/ from the data written by build-data.mjs.
// Usage: node scripts/build-site.mjs
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { RANKINGS, renderLabel } from '../site/label.mjs'
import {
  ECOSYSTEMS,
  categoriesPage,
  categoryPage,
  ecosystemPage,
  homePage, creditsPage,
  packagePage,
  packagesPage,
  runtimePage,
  runtimesPage,
  searchIndex,
  taskPage,
  taskSourcePage,
  eventMedals,
  runtimeMedals,
  allKnownPackages,
  runtimeScores,
  statusOf,
  categoryHref,
  catalogUrl,
  catalogPackagePage,
  listedCategoryPage,
  groupPage,
  adapterSourcePage,
  tasksPage,
  urls,
  versionsOf,
} from '../site/pages.mjs'
import { adapterIdOf } from '../site/source.mjs'
import { iconFiles } from '../site/icons.mjs'
import * as exportsOf from '../site/exports.mjs'
import { llmsText, packageMarkdown, resultRows, taskMarkdown, toCsv } from '../site/exports.mjs'
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { fromRoot, readJson } from './lib/util.mjs'

const dist = (...parts) => fromRoot('dist', ...parts)
async function write(file, content) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, content)
}
const page = (url, html) => write(dist(url, 'index.html'), html)

// The site model: tasks as loaded, plus the cross-cutting views built from
// them (categories, packages, runtimes) that the navigation needs.
const index = await readJson(dist('data/index.json'))
const tasks = []
for (const entry of index.tasks) tasks.push(await readJson(dist(entry.data)))

const packages = new Map()
const runtimes = new Map()
for (const data of tasks) {
  for (const runtime of data.runtimes) {
    runtimes.set(runtime.id, { id: runtime.id, title: runtime.title, version: runtime.version })
    for (const entry of runtime.entries) {
      const key = `${entry.ecosystem}/${entry.package}`
      if (!packages.has(key)) {
        packages.set(key, {
          ecosystem: entry.ecosystem,
          name: entry.package,
          // A variant's title describes the variant; the package page is named for the package.
          title: entry.package === entry.name ? entry.title : entry.package,
          version: entry.defaultVersion ?? entry.version,
          appearances: [],
          // Results for versions other than the ranked one.
          history: [],
        })
      }
      packages.get(key).appearances.push({ data, runtime, entry })
    }
  }
}
for (const data of tasks) {
  for (const runtime of data.runtimes) {
    for (const entry of runtime.history) {
      packages.get(`${entry.ecosystem}/${entry.package}`)?.history.push({ data, runtime, entry })
    }
  }
}
const ecosystemOrder = Object.keys(ECOSYSTEMS)
// Where the source lives, for the links to GitHub; change it in site.json.
const { repository, url: siteUrl = '' } = await readJson(fromRoot('site.json'))
// Links inside the Markdown and llms.txt exports: absolute once site.json
// names the address the site is published at, relative until then.
const exported = { url: (to) => `${siteUrl.replace(/\/$/, '')}${to}`, edition: index.edition }
const model = {
  index,
  repository,
  tasks,
  categories: index.categories.map((c) => ({ ...c, tasks: tasks.filter((d) => d.task.category === c.id) })),
  packages: [...packages.values()].sort(
    (a, b) => ecosystemOrder.indexOf(a.ecosystem) - ecosystemOrder.indexOf(b.ecosystem) || a.title.localeCompare(b.title),
  ),
  runtimes: [...runtimes.values()],
  packageOf: (entry) => packages.get(`${entry.ecosystem}/${entry.package}`),
}

// The catalog: the most used packages of every ecosystem, each with its
// category from the categorization and, when it has results, its measured
// package. Go modules are measured under a short name.
const GO_MODULES = { 'github.com/go-chi/chi': 'chi', 'github.com/gin-gonic/gin': 'gin' }
const { categories: taxonomy, groups = [] } = await readJson(fromRoot('data/taxonomy.json'), { categories: [] })
const taxonomyById = new Map(taxonomy.map((c) => [c.id, c]))
const typeData = await readJson(fromRoot('data/types.json'), { packages: {}, compilers: {} })
const catalog = { groups, categories: taxonomy, byEcosystem: {}, byCategory: new Map() }
for (const id of ecosystemIds) {
  const eco = ecosystem(id)
  const listed = await readJson(fromRoot(eco.packages), [])
  if (listed.length === 0) continue
  const assigned = await readJson(fromRoot(eco.categories), {})
  catalog.byEcosystem[id] = listed.map((p) => {
    const typed = id === 'npm' ? typeData.packages[p.name] : null
    const tsgo = typed?.status === 'ok' ? typed.tsgo : null
    const item = {
      ecosystem: id,
      name: p.name,
      rank: p.rank,
      popularity: { value: p.downloads ?? p.dependents ?? 0, label: eco.popularity },
      description: p.description,
      version: p.version,
      repository: p.repository,
      category: taxonomyById.get(assigned[p.name]?.category) ?? null,
      measured: packages.get(`${id}/${id === 'gomod' ? (GO_MODULES[p.name] ?? p.name) : p.name}`) ?? null,
      // Same cost as the graded packages: the root of added CPU time (at least 10 ms) times added memory.
      typeCheck: tsgo && Number.isFinite(tsgo.cpuMs) ? { tool: `tsgo ${typeData.compilers.tsgo}`, cpuMs: Math.max(0, tsgo.cpuMs), memoryMb: Math.max(0, tsgo.memoryKb) / 1000, cost: Math.sqrt((Math.max(0, tsgo.memoryKb) / 1000) * Math.max(tsgo.cpuMs, 10)) } : null,
    }
    if (item.category) catalog.byCategory.set(item.category.id, [...(catalog.byCategory.get(item.category.id) ?? []), item])
    return item
  })
}
// Registries count use differently (per month, in total, by dependents), so
// across them a package is compared by its share of its own registry's
// listed use, and a category by the average of its share in each registry.
for (const items of Object.values(catalog.byEcosystem)) {
  const total = items.reduce((sum, item) => sum + item.popularity.value, 0) || 1
  for (const item of items) {
    item.share = item.popularity.value / total
    if (item.measured) item.measured.listed = item
  }
}
catalog.categoryShare = new Map([...catalog.byCategory].map(([id, members]) => [id, members.reduce((sum, item) => sum + item.share, 0) / Object.keys(catalog.byEcosystem).length]))
catalog.updated = await readJson(fromRoot('data/popularity.json'), {})
for (const members of catalog.byCategory.values()) members.sort((a, b) => b.share - a.share || a.name.localeCompare(b.name))
model.catalog = catalog

// A task's medals are worked out once and shared by every export.
const medalCache = new Map()
const medalsOf = (data) => medalCache.get(data) ?? medalCache.set(data, eventMedals(data)).get(data)
// Everything the Markdown, CSV and JSON versions of the pages need.
const ctx = { ...exported, model, ecosystems: ECOSYSTEMS, runtimeScores, statusOf, categoryHref, catalogUrl, allKnownPackages, eventMedals: medalsOf, runtimeMedals }
// Write a page's other forms beside it: index.md, and its rows as
// results.csv and results.json when it lists something.
async function emit(path, { markdown, rows }) {
  await write(dist(path, 'index.md'), markdown)
  if (!rows) return
  await write(dist(path, 'results.csv'), toCsv(rows))
  await write(dist(path, 'results.json'), JSON.stringify(rows))
}

let labels = 0
for (const data of tasks) {
  await page(urls.task(data.task.id), taskPage(data, model))
  await page(urls.source(data.task.id), taskSourcePage(data, model))
  await write(dist(urls.task(data.task.id), 'index.md'), taskMarkdown(data, ctx))
  await write(dist(urls.task(data.task.id), 'results.csv'), toCsv(resultRows(data, ctx)))
  await emit(urls.source(data.task.id), exportsOf.taskSourceExport(ctx, data))
  for (const adapterId of new Set(data.runtimes.flatMap((r) => [...r.entries, ...r.history]).map(adapterIdOf))) {
    await page(urls.source(data.task.id, adapterId), adapterSourcePage(data, adapterId, model))
    await emit(urls.source(data.task.id, adapterId), exportsOf.adapterSourceExport(ctx, data, adapterId))
  }
  for (const runtime of data.runtimes) {
    for (const entry of runtime.entries) {
      for (const rankingId of Object.keys(RANKINGS)) {
        const svg = renderLabel({ entry, data, runtime, rankingId, standalone: true })
        if (!svg) continue
        await write(dist(urls.label(data.task.id, runtime.id, entry.id, rankingId)), svg)
        labels++
      }
    }
    for (const entry of runtime.history) {
      for (const rankingId of Object.keys(RANKINGS)) {
        const svg = renderLabel({ entry, data, runtime, rankingId, standalone: true })
        if (!svg) continue
        await write(dist(urls.label(data.task.id, runtime.id, entry.id, rankingId, entry.version)), svg)
        labels++
      }
    }
  }
}
for (const category of model.categories) {
  await page(urls.category(category.id), categoryPage(category, model))
  await emit(urls.category(category.id), exportsOf.categoryExport(ctx, category))
}
for (const pkg of model.packages) {
  // The bare package URL is the latest version; every version also has its own.
  await page(urls.package(pkg), packagePage(pkg, model))
  const own = [...new Set(pkg.appearances.map((a) => a.data))].flatMap((data) => resultRows(data, ctx).filter((row) => row.ecosystem === pkg.ecosystem && row.package === pkg.name))
  await write(dist(urls.package(pkg), 'index.md'), packageMarkdown(pkg, ECOSYSTEMS[pkg.ecosystem].title, ctx))
  await write(dist(urls.package(pkg), 'results.csv'), toCsv(own))
  await write(dist(urls.package(pkg), 'results.json'), JSON.stringify(own, null, 2))
  for (const version of versionsOf(pkg)) await page(urls.package(pkg, version), packagePage(pkg, model, version))
}
for (const id of ecosystemOrder) {
  await page(urls.ecosystem(id), ecosystemPage(id, model))
  await emit(urls.ecosystem(id), exportsOf.ecosystemExport(ctx, id))
}
for (const group of groups) {
  await page(urls.group(group.id), groupPage(group, model))
  await emit(urls.group(group.id), exportsOf.categoriesExport(ctx, group))
}
// Listed packages and categories without results get a page of their own.
const taken = new Set(['source', 'data', 'labels', 'runtimes', 'packages', 'tasks', 'categories', 'credits', ...ecosystemOrder, ...model.categories.map((c) => c.id)])
let listedPages = 0
for (const category of taxonomy) {
  if (model.categories.some((c) => c.taxonomy === category.id)) continue
  if (taken.has(category.id)) throw new Error(`category id "${category.id}" collides with another page`)
  await page(`/${category.id}/`, listedCategoryPage(category, model))
  await emit(`/${category.id}/`, exportsOf.listedCategoryExport(ctx, category))
}
for (const items of Object.values(catalog.byEcosystem)) {
  for (const item of items) {
    if (item.measured) continue
    await page(`/${item.ecosystem}/${item.name}/`, catalogPackagePage(item, model))
    await emit(`/${item.ecosystem}/${item.name}/`, exportsOf.catalogPackageExport(ctx, item))
    listedPages++
  }
}
await page('/tasks/', tasksPage(model))
await emit('/tasks/', exportsOf.tasksExport(ctx))
await page('/categories/', categoriesPage(model))
await emit('/categories/', exportsOf.categoriesExport(ctx))
await page('/packages/', packagesPage(model))
await emit('/packages/', exportsOf.packagesExport(ctx))
await page('/runtimes/', runtimesPage(model))
await emit('/runtimes/', exportsOf.runtimesExport(ctx))
for (const runtime of model.runtimes) {
  await page(urls.runtime(runtime.id), runtimePage(runtime, model))
  await emit(urls.runtime(runtime.id), exportsOf.runtimeExport(ctx, runtime))
}
await emit('/credits/', exportsOf.creditsExport(ctx))
await emit('/', exportsOf.homeExport(ctx))
await page('/credits/', creditsPage(model))
await page('/', homePage(model))
await write(dist('search.json'), JSON.stringify(searchIndex(model)))
const allRows = tasks.flatMap((data) => resultRows(data, ctx))
await write(dist('data/results.csv'), toCsv(allRows))
await write(dist('data/results.json'), JSON.stringify(allRows))
await write(dist('llms.txt'), llmsText(model, ECOSYSTEMS, ctx))
// The packages without results, compactly, for the package table to add to
// its rows in the browser: [registry, name, version, use, share, category,
// category page, rank in its registry, status].
await write(dist('data/catalog.json'), JSON.stringify({
  registries: Object.fromEntries(Object.entries(catalog.byEcosystem).map(([id, items]) => [id, { title: ECOSYSTEMS[id].title, measure: items[0]?.popularity.label ?? '' }])),
  packages: Object.values(catalog.byEcosystem).flat().filter((item) => !item.measured).sort((a, b) => b.share - a.share).map((item) => [item.ecosystem, item.name, item.version ?? '', item.popularity.value, Number(item.share.toPrecision(4)), item.category?.title ?? '', item.category ? categoryHref(item.category.id, model) : '', item.rank, statusOf(item)]),
}))
for (const [id, svg] of Object.entries(iconFiles())) await write(dist('icons', `${id}.svg`), svg)
await copyFile(fromRoot('site/styles.css'), dist('styles.css'))
await copyFile(fromRoot('site/app.js'), dist('app.js'))

console.log(`dist/: ${tasks.length} task(s), ${model.categories.length} categories, ${model.packages.length} packages, ${labels} labels, ${listedPages} listed packages without results`)

await copyFile(fromRoot('site/sort.mjs'), dist('sort.mjs'))
