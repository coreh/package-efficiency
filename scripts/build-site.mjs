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
  adapterSourcePage,
  tasksPage,
  urls,
  versionsOf,
} from '../site/pages.mjs'
import { adapterIdOf } from '../site/source.mjs'
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
const { repository } = await readJson(fromRoot('site.json'))
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

let labels = 0
for (const data of tasks) {
  await page(urls.task(data.task.id), taskPage(data, model))
  await page(urls.source(data.task.id), taskSourcePage(data, model))
  for (const adapterId of new Set(data.runtimes.flatMap((r) => [...r.entries, ...r.history]).map(adapterIdOf))) {
    await page(urls.source(data.task.id, adapterId), adapterSourcePage(data, adapterId, model))
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
for (const category of model.categories) await page(urls.category(category.id), categoryPage(category, model))
for (const pkg of model.packages) {
  // The bare package URL is the latest version; every version also has its own.
  await page(urls.package(pkg), packagePage(pkg, model))
  for (const version of versionsOf(pkg)) await page(urls.package(pkg, version), packagePage(pkg, model, version))
}
for (const id of ecosystemOrder) await page(urls.ecosystem(id), ecosystemPage(id, model))
await page('/tasks/', tasksPage(model))
await page('/categories/', categoriesPage(model))
await page('/packages/', packagesPage(model))
await page('/runtimes/', runtimesPage(model))
for (const runtime of model.runtimes) await page(urls.runtime(runtime.id), runtimePage(runtime, model))
await page('/credits/', creditsPage(model))
await page('/', homePage(model))
await write(dist('search.json'), JSON.stringify(searchIndex(model)))
await copyFile(fromRoot('site/styles.css'), dist('styles.css'))
await copyFile(fromRoot('site/app.js'), dist('app.js'))

console.log(`dist/: ${tasks.length} task(s), ${model.categories.length} categories, ${model.packages.length} packages, ${labels} labels`)

await copyFile(fromRoot('site/sort.mjs'), dist('sort.mjs'))
