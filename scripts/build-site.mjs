// Render the static site into dist/ from the data written by build-data.mjs.
// Usage: node scripts/build-site.mjs
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { RANKINGS, issueShortLinks, labelSite, renderLabel, resultShort, shortCodes } from '../site/label.mjs'
import { EMBED_SHARDS, SHARDS, embedShardOf, shardOf } from '../site/lazy.mjs'
import {
  ECOSYSTEMS,
  categoriesPage,
  categoryPage,
  ecosystemPage,
  homePage, creditsPage, notFoundPage, resultPage, summaryPage, summaryScopes,
  packagePage,
  packagesPage,
  runtimePage,
  runtimesPage,
  searchIndex, statsPage, statsMarkdown,
  bestResult,
  runtimeSummaries,
  categoryIconFiles,
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
import { iconFile, iconFiles, iconScales } from '../site/icons.mjs'
import { embedFiles } from '../site/layouts.mjs'
import * as exportsOf from '../site/exports.mjs'
import { llmsText, packageMarkdown, resultRows, taskMarkdown, toCsv } from '../site/exports.mjs'
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { fromRoot, readJson, writeJson } from './lib/util.mjs'

const dist = (...parts) => fromRoot('dist', ...parts)
// Most of the site is the same from one build to the next, so a file is only
// written when its content has changed since the last build (by a hash kept
// in .cache/site-manifest.json). Everything produced is noted, and whatever
// is left in dist/ that this build did not produce is removed at the end.
const MANIFEST = fromRoot('.cache/site-manifest.json')
const before = await readJson(MANIFEST, {})
const produced = {}
let rewritten = 0
async function write(file, content) {
  const key = path.relative(dist(), file)
  const hash = createHash('sha1').update(content).digest('base64')
  produced[key] = hash
  if (before[key] === hash && existsSync(file)) return
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, content)
  rewritten++
}
// Every page's address, for the sitemap.
const addresses = []
const page = (url, html) => { addresses.push(url); return write(dist(url, 'index.html'), html) }

// The site model: tasks as loaded, plus the cross-cutting views built from
// them (categories, packages, runtimes) that the navigation needs.
const index = await readJson(dist('data/index.json'))
const generatedDay = String(index.generatedAt).slice(0, 10)
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
// site.json also names the address the site is published at (`url`) and
// whether search engines may index it (`indexable`, off while the site is a
// work in progress). SITE_URL overrides the address for one build, for
// example to publish a preview somewhere else.
const settings = await readJson(fromRoot('site.json'))
const { repository } = settings
const siteUrl = (process.env.SITE_URL ?? settings.url ?? '').replace(/\/$/, '')
const indexable = settings.indexable === true
// Labels carry the address they come from.
labelSite.url = siteUrl
// A shorter address for the links printed on labels, if there is one.
labelSite.shortUrl = (settings.shortUrl ?? '').replace(/\/$/, '')
labelSite.host = siteUrl.replace(/^https?:\/\//, '')
// Links inside the Markdown and llms.txt exports: absolute once site.json
// names the address the site is published at, relative until then.
const exported = { url: (to) => `${siteUrl}${to}`, edition: index.edition }
const model = {
  index,
  repository,
  site: { url: siteUrl, indexable },
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
// Other names people search a category by (see searchIndex).
const aliases = await readJson(fromRoot('data/category-aliases.json'), {})
const catalog = { groups, categories: taxonomy, aliases, byEcosystem: {}, byCategory: new Map() }
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
      typeCheck: tsgo && Number.isFinite(tsgo.cpuMs) ? { tool: `tsgo ${typeData.compilers.tsgo}`, cpuMs: Math.max(0, tsgo.cpuMs), memoryMb: Math.max(0, tsgo.memoryKb) / 1000, cost: ((Math.max(0, tsgo.memoryKb) / 1000) * Math.max(tsgo.cpuMs, 10)) / 1000 } : null,
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

// Packages that are listed but not measured are most of the site's pages and
// say little each, so they are not written as files: they are packed into
// dist/lazy/ and put together on request by site/worker.mjs. A page is kept
// as the text before its sidebar, the sidebar (shared by every package of a
// category, so stored once) and the text after it, plus its Markdown.
const packs = new Map()
const sidebars = new Map()
function lazyPage(address, html, markdown) {
  const start = html.indexOf('<nav class="side"')
  const end = html.indexOf('</nav>', start) + '</nav>'.length
  if (start < 0) throw new Error(`no sidebar in the page for ${address}`)
  const sidebar = html.slice(start, end)
  const id = createHash('sha1').update(sidebar).digest('hex').slice(0, 16)
  sidebars.set(id, sidebar)
  addresses.push(address)
  const shard = shardOf(address)
  if (!packs.has(shard)) packs.set(shard, {})
  packs.get(shard)[address] = [html.slice(0, start), id, html.slice(end), markdown]
}

// Short links to result pages (/r/<code>). Codes are given out once and kept
// in data/short-links.json, so a link printed on a label goes on working as
// results are added; see issueShortLinks. Results new in this build are added
// to that record, which belongs in the repository.
const resultAddresses = tasks.flatMap((data) => data.runtimes.flatMap((runtime) => [...runtime.entries, ...runtime.history].map((entry) => urls.result(data.task.id, runtime.id, entry))))
const issuedBefore = await readJson(fromRoot('data/short-links.json'), {})
// A runtime's summary labels have pages and short links too.
const summaries = summaryScopes(model).flatMap((scope) => scope.runtimes.map((rt) => ({ scope, rt, address: urls.summary(rt.id, scope.key) })))
const issued = issueShortLinks(issuedBefore, [...resultAddresses, ...summaries.map((s) => s.address)])
if (Object.keys(issued).length !== Object.keys(issuedBefore).length) await writeJson(fromRoot('data/short-links.json'), Object.fromEntries(Object.entries(issued).sort(([, a], [, b]) => a.localeCompare(b))))
for (const [code, address] of Object.entries(issued)) shortCodes.set(address, code)
const linked = new Set([...resultAddresses, ...summaries.map((s) => s.address)])
const shortLinks = Object.fromEntries(Object.entries(issued).filter(([, address]) => linked.has(address)))
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
    // Each result's own page, current and earlier versions alike.
    for (const entry of [...runtime.entries, ...runtime.history]) {
      const address = urls.result(data.task.id, runtime.id, entry)
      await page(address, resultPage(data, runtime, entry, model))
      await emit(address, exportsOf.resultExport(ctx, data, runtime, entry, address))
    }
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
  for (const version of versionsOf(pkg)) {
    await page(urls.package(pkg, version), packagePage(pkg, model, version))
    // The Markdown of a version page: the same package, with that version's results.
    const results = [...pkg.appearances, ...pkg.history].filter((a) => a.entry.version === version)
    if (results.length) await write(dist(urls.package(pkg, version), 'index.md'), packageMarkdown({ ...pkg, version, appearances: results }, ECOSYSTEMS[pkg.ecosystem].title, ctx))
  }
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
    lazyPage(`/${item.ecosystem}/${item.name}/`, catalogPackagePage(item, model), exportsOf.catalogPackageExport(ctx, item).markdown)
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
// Embeddable shapes of every result's labels, and of each package's best
// result in each task under the package's own address. They are many and
// small, so they are packed for site/worker.mjs to hand out (see site/lazy.mjs).
const embedPacks = Array.from({ length: EMBED_SHARDS }, () => ({}))
let embeds = 0
const embed = (address, svg) => { if (svg) { embedPacks[embedShardOf(address)][address] = svg; embeds++ } }
for (const data of tasks) {
  for (const runtime of data.runtimes) {
    for (const [entries, versioned] of [[runtime.entries, false], [runtime.history, true]]) {
      for (const entry of entries) for (const [file, svg] of embedFiles({ entry, runtime, data })) embed(urls.embedResult(data.task.id, runtime.id, entry.id, versioned ? entry.version : null, file), svg)
    }
  }
}
for (const pkg of model.packages) {
  for (const data of new Set(pkg.appearances.map((a) => a.data))) {
    const best = bestResult(pkg.appearances.filter((a) => a.data === data))
    for (const [file, svg] of embedFiles(best)) embed(urls.embed(data.task.id, pkg, file), svg)
  }
}
// A runtime's summary labels: the full label too, which has no file elsewhere.
for (const { base, summary } of runtimeSummaries(model)) {
  for (const rankingId of Object.keys(RANKINGS)) embed(`${base}label.${rankingId}.svg`, renderLabel({ ...summary, rankingId, standalone: true }))
  for (const [file, svg] of embedFiles({ ...summary, summary })) embed(`${base}${file}`, svg)
}
for (const [shard, pack] of embedPacks.entries()) await write(dist('lazy/embed', `${shard}.json`), JSON.stringify(pack))
await page('/credits/', creditsPage(model))
await page('/stats/', statsPage(model))
await write(dist('stats', 'index.md'), statsMarkdown(model))
// Summary pages are many and alike, so they are packed like the unmeasured
// package pages and put together on request.
for (const { scope, rt, address } of summaries) lazyPage(address, summaryPage(scope, rt, model), `# ${rt.title} in ${scope.title}: Package Efficiency Labels\n\nA running summary of ${rt.title} ${rt.version} in ${scope.title}. The figures are on ${siteUrl}${urls.runtime(rt.id)}index.md\n`)
// Served by the host for any address that is not a page (see wrangler.jsonc).
await write(dist('404.html'), notFoundPage(model))
await write(dist('lazy/not-found.txt'), notFoundPage(model))
await write(dist('lazy/short.json'), JSON.stringify(shortLinks))
for (let shard = 0; shard < SHARDS; shard++) await write(dist('lazy/pages', `${shard}.json`), JSON.stringify(packs.get(shard) ?? {}))
for (const [id, sidebar] of sidebars) await write(dist('lazy/side', `${id}.txt`), sidebar)
await page('/', homePage(model))
// The sitemap needs full addresses, so it is written once site.json has one.
// It is built whether or not the site may be indexed yet, and robots.txt
// points to it only when it may.
if (siteUrl) {
  const day = generatedDay
  await write(dist('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(addresses)].sort().map((to) => `<url><loc>${`${siteUrl}${encodeURI(to).replace(/@/g, '%40')}`.replace(/&/g, '&amp;')}</loc><lastmod>${day}</lastmod></url>`).join('\n')}\n</urlset>\n`)
}
await write(dist('robots.txt'), indexable ? `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}` : 'User-agent: *\nDisallow: /\n')
await write(dist('search.json'), JSON.stringify(searchIndex(model)))
const allRows = tasks.flatMap((data) => resultRows(data, ctx))
await write(dist('data/results.csv'), toCsv(allRows))
await write(dist('data/results.json'), JSON.stringify(allRows))
await write(dist('llms.txt'), llmsText(model, ECOSYSTEMS, ctx))
// Each group's categories, for the menu on a phone to open a group in place.
await write(dist('data/menu.json'), JSON.stringify(Object.fromEntries(groups.map((group) => [group.id, taxonomy.filter((c) => c.group === group.id).map((c) => {
  const measured = model.categories.find((m) => m.taxonomy === c.id)
  return [measured?.title ?? c.title, categoryHref(c.id, model), measured ? 1 : 0]
}).sort((a, b) => b[2] - a[2] || a[0].localeCompare(b[0]))]))))
// The packages without results, compactly, for the package table to add to
// its rows in the browser: [registry, name, version, use, share, category,
// category page, rank in its registry, status].
await write(dist('data/catalog.json'), JSON.stringify({
  registries: Object.fromEntries(Object.entries(catalog.byEcosystem).map(([id, items]) => [id, { title: ECOSYSTEMS[id].title, measure: items[0]?.popularity.label ?? '' }])),
  packages: Object.values(catalog.byEcosystem).flat().filter((item) => !item.measured).sort((a, b) => b.share - a.share).map((item) => [item.ecosystem, item.name, item.version ?? '', item.popularity.value, Number(item.share.toPrecision(4)), item.category?.title ?? '', item.category ? categoryHref(item.category.id, model) : '', item.rank, statusOf(item)]),
}))
for (const [id, svg] of Object.entries(iconFiles())) await write(dist('icons', `${id}.svg`), svg)
// Search results draw their icons from files: registries, runtimes, categories.
for (const id of [...Object.keys(ECOSYSTEMS).map((id) => `eco-${id}`), ...model.runtimes.map((rt) => rt.id)]) if (iconFile(id)) await write(dist('icons/s', `${id}.svg`), iconFile(id))
for (const [file, svg] of Object.entries(categoryIconFiles())) await write(dist('icons/cat', file), svg)
// The search results' marks are images, so their optical sizes are rules keyed on the file.
await write(dist('styles.css'), `${await readFile(fromRoot('site/styles.css'), 'utf8')}\n${Object.entries(iconScales).map(([id, scale]) => `#q-results img[src$="/s/${id}.svg"] { transform: scale(${scale}); }`).join('\n')}\n`)
await write(dist('app.js'), await readFile(fromRoot('site/app.js')))


await write(dist('sort.mjs'), await readFile(fromRoot('site/sort.mjs')))

// Remove what an earlier build left behind and this one did not produce. The
// task data written by build-data.mjs just before this script is kept, and so
// are scratch files whose names start with an underscore.
const kept = new Set([...Object.keys(produced), 'data/index.json', ...index.tasks.map((task) => task.data)])
let removed = 0
for (const entry of await readdir(dist(), { recursive: true, withFileTypes: true })) {
  if (!entry.isFile()) continue
  const key = path.relative(dist(), path.join(entry.parentPath, entry.name))
  if (kept.has(key) || entry.name.startsWith('_')) continue
  await rm(dist(key))
  removed++
}
await mkdir(path.dirname(MANIFEST), { recursive: true })
await writeFile(MANIFEST, JSON.stringify(produced))

console.log(`dist/: ${tasks.length} task(s), ${model.categories.length} categories, ${model.packages.length} packages, ${labels} labels, ${listedPages} listed packages without results; ${rewritten} files written, ${removed} removed`)
