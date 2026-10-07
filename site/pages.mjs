// HTML for the static site, rendered from the site model built in
// scripts/build-site.mjs. All links are root-relative.
import { readdirSync, readFileSync } from 'node:fs'
import { activeReleaseRows } from '../scripts/lib/releases.mjs'
import { assistantIcon, groupIcon, inlineIcon } from './icons.mjs'
import { adapterIdOf, adapterSource, taskSource } from './source.mjs'
import { overviewLabel } from './layouts.mjs'
import { CLASSES, LEAST, RANKINGS, classColor, formatAtLeast, formatNumber, inkOn, metricFor, renderLabel, resultPath, resultShort, resultShortLink, shortLinkOf } from './label.mjs'

const esc = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const plural = (n, word) => `${n} ${n === 1 ? word : word.endsWith('y') ? `${word.slice(0, -1)}ies` : `${word}s`}`
const NA = '<span class="na" aria-label="not applicable">—</span>'
// `least` is the smallest amount that can be told apart; below it the cell
// reads "< least" (see formatAtLeast).
const num = (value, unit = '', least = 0) => (value === null || value === undefined ? NA : `${formatAtLeast(value, least).replace('<', '&lt;')}${unit}`)

export const ECOSYSTEMS = {
  npm: { title: 'npm', registry: (name) => `https://www.npmjs.com/package/${name}` },
  jsr: { title: 'JSR', registry: (name) => `https://jsr.io/${name}` },
  pypi: { title: 'PyPI', registry: name => `https://pypi.org/project/${name}/` },
  rubygems: { title: 'RubyGems', registry: name => `https://rubygems.org/gems/${name}` },
  gomod: { title: 'Go modules', registry: name => `https://pkg.go.dev/${name}` },
  cargo: { title: 'crates.io', registry: (name) => `https://crates.io/crates/${name}` },
  builtin: { title: 'Runtime built-ins', registry: null },
}

export const urls = {
  task: (id) => `/${id}/`,
  category: (id) => `/${id}/`,
  ecosystem: (id) => `/${id}/`,
  // Without a version this is the latest measured one, which rankings use.
  package: (pkg, version) => `/${pkg.ecosystem}/${pkg.name}/${version ? `${version}/` : ''}`,
  runtime: (id) => `/runtimes/${id}/`,
  // Benchmark source code: a task's own files, or one adapter's.
  group: (id) => `/categories/${id}/`,
  source: (taskId, adapterId) => `/source/${taskId}/${adapterId ? `${adapterId}/` : ''}`,
  // One result: an entry at one version on one runtime. Never changes.
  result: (taskId, runtimeId, entry) => resultPath(taskId, runtimeId, entry),
  // A runtime's summary labels in one scope: every category, a category or a task.
  summary: (runtimeId, scopeKey) => `/results/runtimes/${runtimeId}/${scopeKey}/`,
  // The embeddable labels of a package's best result in a task.
  embed: (taskId, pkg, file) => `/embed/${taskId}/${pkg.ecosystem}/${pkg.name}/${file}`,
  // The same shapes for one result: an entry on one runtime. With a version
  // it is that version for good; without, whichever is measured now.
  // And for a runtime's summary label in one scope, by its best or typical entry.
  embedSummary: (runtimeId, scopeKey, basis, file) => `/embed/runtimes/${runtimeId}/${scopeKey}/${basis}/${file}`,
  embedResult: (taskId, runtimeId, entryId, version, file) => `/embed/${taskId}/${runtimeId}/${entryId}${version ? `@${version}` : ''}/${file}`,
  label: (taskId, runtimeId, entryId, rankingId, version) => `/labels/${taskId}/${runtimeId}/${entryId}${version ? `@${version}` : ''}.${rankingId}.svg`,
}

// Shows or hides the reference rows of every table on the page (styles.css).
// A reference entry has no class: its chip holds an R, and says its multiple of the best graded entry on hover.
const times = (ratio) => `${ratio < 10 ? String(Math.round(ratio * 10) / 10) : Math.round(ratio)}×`
function chip(rankingId, grade, text) {
  if (grade?.reference) return `<span class="cls ref" title="Reference, not graded: ${times(grade.ratio)} the best graded entry" role="img" aria-label="Reference, not graded">R</span>`
  if (!grade?.class) return ''
  const color = classColor(rankingId, grade.class)
  return `<span class="cls" style="background:${color};color:${inkOn(color)}"${text ? ` title="${esc(text)}"` : ''}>${grade.class}</span>`
}

// A table cell that the sort script can order by `value`.
const cell = (value, html) => `<td data-v="${value ?? ''}">${html}</td>`
// Across tasks the class is comparable; raw µs/MB are not. Ratio breaks ties
// within a class, respecting tasks that use different grading thresholds.
// A graded cell can be sorted two ways: by its figure (`data-value`) or by its
// class and then its multiple of the best (`data-grade`, `data-v`). `extra`
// adds further sortable figures.
// A reference entry sorts by its ratio like the others; as a class it comes before A.
const overheadNote = (grade) => grade?.overhead ? `<span class="overhead" title="${times(grade.overhead.ratio)} the cost of ${esc(grade.overhead.title)} on the same runtime">${times(grade.overhead.ratio)} reference</span>` : ''
const gradedCell = (grade, html, extra = '') => grade?.class || grade?.reference
  ? `<td data-grade="${grade.class ? CLASSES.indexOf(grade.class) : -1}" data-v="${grade.ratio ?? ''}" data-value="${grade.value ?? ''}"${extra}>${html}${overheadNote(grade)}</td>`
  : cell(null, html)
// A type-check cost: the time and memory added, and the class of their product.
// The type-check score's unit, shown once in the legend; cells and labels give
// the bare number. Set as real mathematics so the radical covers the whole product. A megabyte-millisecond is exactly a kilobyte-second, so
// the simpler pair is shown; the inputs are still measured in MB and ms.
const ROOT_MB_MS = 'MB·s'
// A one-line key for the type-check cells, placed under every table that has them.
const TYPE_KEY = `<p class="soft key">Type check: added CPU time, added memory, then the cost in bold. The cost is CPU time multiplied by memory, in ${ROOT_MB_MS}. Lower is better.</p>`
// Marks a type-check figure taken from types that the package's authors did
// not publish (@types/*, stub packages, signature collections).
const communityMark = (types) => types?.community ? `<span class="community" title="Checked with community types${types.from ? ` (${esc(types.from)})` : ''}, not types from the package's authors">*</span>` : ''
const typeCost = (cost, grade = cost) => {
  if (!cost) return cell(null, NA)
  const score = grade?.value ?? cost.score ?? cost.value
  // The score and its two ingredients. Elapsed time is not part of the score, so it is a tooltip.
  const figures = ` data-time="${cost.cpuMs ?? ''}" data-memory="${cost.memoryMb ?? ''}" data-score="${score ?? ''}"`
  return gradedCell(grade, `<span class="type-cost" title="${formatNumber(cost.timeMs)} ms elapsed"><span>${communityMark(cost)}${cost.cpuMs < 10 ? '&lt; 10' : formatNumber(cost.cpuMs)} ms</span><span>${esc(formatAtLeast(cost.memoryMb, LEAST.memory))} MB</span><span class="type-cost-score">${score === null || score === undefined ? '' : `${esc(formatAtLeast(score, LEAST.types))} <span class="unit">MB·s</span>`}</span><span class="type-cost-grade">${chip('types', grade)}</span></span>`, figures)
}
const sortable = (text, attrs = '') => `<th scope="col"${attrs}><button type="button" data-sort>${text}</button></th>`
// A graded column has one sort control that steps through several orders:
// each press goes ascending, then descending, then on to the next field in
// `data-fields`. The script names the field in use in the slot before the
// title. The slot always takes the same width, so nothing moves when it fills.
const SORT_SLOT = '<small class="sort-field" aria-live="polite"></small>'
const sortableGraded = (text) => `<th scope="col" data-col="${text}" data-fields="grade,value">${SORT_SLOT}<button type="button" data-sort>${text}</button></th>`
const sortableTypes = (text) => `<th scope="col" data-col="${text}" data-fields="grade,score,time,memory">${SORT_SLOT}<button type="button" data-sort>${text}</button></th>`

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&amp;display=swap">'
// The site's mark: five class arrows in the CPU colours. Three in the tab icon,
// where five would blur.
// On the top arrow sits the pointer of a label, the same height as the arrow
// and in the text colour, so it shows on a light or a dark bar.
const LOGO = () => scaleIcon('cpu', { attrs: 'class="logo"', bars: 5 }).replace('viewBox="0 0 44 40"', 'viewBox="0 0 52 40"').replace('</svg>', '<path d="M32.500 3.200L36.500 0H52v6.400H36.500z" style="fill:var(--ink)"/></svg>')
// The browser-tab icon: three bars and the pointer. The pointer has to show
// on light and dark tab strips, and browsers differ in how an icon can follow
// the colour scheme, so three are offered: a mid-grey pointer for a browser
// that picks the first, then a dark one and a light one chosen by `media`.
const tabIcon = (pointer) => `data:image/svg+xml,${encodeURIComponent(scaleIcon('cpu', { attrs: 'xmlns="http://www.w3.org/2000/svg"', bars: 3 }).replace('viewBox="0 0 44 40"', 'viewBox="0 0 52 40"').replace('</svg>', `<path fill="${pointer}" d="M30 5.330L36 0H52v10.670H36z"/></svg>`))}`
const ICON_LINKS = () => `<link rel="icon" href="${tabIcon('#8a8a8a')}">
<link rel="icon" media="(prefers-color-scheme: light)" href="${tabIcon('#111')}">
<link rel="icon" media="(prefers-color-scheme: dark)" href="${tabIcon('#fff')}">`

// The catalog tree shown beside every page. It stays short as the catalog
// grows: only the category in `context` is opened to its tasks and packages.
// The small count after a category in the menu: its packages, and for a
// measured category how many of them are measured. Worked out once.
function categoryCount(model, taxonomyId, measured) {
  model.categoryCounts ??= new Map()
  if (!model.categoryCounts.has(taxonomyId)) {
    const listed = model.catalog.byCategory.get(taxonomyId)?.length ?? 0
    const done = measured ? model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === measured.id && !a.entry.reference)).length : 0
    const total = Math.max(listed, done)
    model.categoryCounts.set(taxonomyId, total ? ` <span class="count">${done ? `${done} of ${total}` : total}</span>` : '')
  }
  return model.categoryCounts.get(taxonomyId)
}

function sidebar(model, path, context) {
  const link = (href, text, extra = '') => `<a href="${href}"${href === path ? ' aria-current="page"' : ''}>${esc(text)}${extra}</a>`
  // Categories are listed by group. Only the group of the page being shown is
  // opened, and inside it only that page's category.
  const measuredOf = (taxonomyId) => model.categories.find((c) => c.taxonomy === taxonomyId)
  // `context` is a parameter so the same list can be drawn opened at another
  // category, for a package that is in several (see `alternates` below).
  const categoryList = (context) => {
  const here = context.listed ?? model.categories.find((c) => c.id === context.category)?.taxonomy
  const hereGroup = context.group ?? model.catalog.categories.find((c) => c.id === here)?.group
  const categoryItem = (c) => {
    const measured = measuredOf(c.id)
    const count = categoryCount(model, c.id, measured)
    if (!measured) return `<li>${link(`/${c.id}/`, c.title, count)}</li>`
    if (measured.id !== context.category) return `<li>${link(urls.category(measured.id), measured.title, count)}</li>`
    const inCategory = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === measured.id))
    // Entries kept for reference have a list of their own.
    const isReference = (p) => p.appearances.filter((a) => a.data.task.category === measured.id).every((a) => a.entry.reference)
    const packages = inCategory.filter((p) => !isReference(p))
    const references = inCategory.filter(isReference)
    return `<li>${link(urls.category(measured.id), measured.title, count)}<ul>${measured.tasks.map((d) => `<li>${link(urls.task(d.task.id), d.task.title)}</li>`).join('')}</ul>
<h3>Packages in ${esc(measured.title)}</h3><ul>${packages.slice(0, SIDE_LIMIT).map((p) => `<li>${link(urls.package(p), p.title)}</li>`).join('')}${packages.length > SIDE_LIMIT ? `<li><a class="more" href="${urls.category(measured.id)}">All ${packages.length} packages</a></li>` : ''}</ul>${references.length ? `
<h3>For reference</h3><ul>${references.map((p) => `<li>${link(urls.package(p), p.title)}</li>`).join('')}</ul>` : ''}</li>`
  }
  return (model.catalog.groups ?? [])
    .map((group) => {
      const members = model.catalog.categories.filter((c) => c.group === group.id)
      const measured = members.filter((c) => measuredOf(c.id)).length
      const head = `<a href="${urls.group(group.id)}"${urls.group(group.id) === path ? ' aria-current="page"' : ''}>${groupIcon(group.id)}${esc(group.title)} <span class="count">${measured ? `${measured} of ${members.length}` : members.length}</span></a>`
      if (group.id !== hereGroup) return `<li>${head}</li>`
      // Measured categories first, then the rest by name.
      const ordered = [...members].sort((a, b) => !!measuredOf(b.id) - !!measuredOf(a.id) || a.title.localeCompare(b.title))
      return `<li class="open">${head}<ul>${ordered.map(categoryItem).join('')}</ul></li>`
    })
    .join('')
  }
  // A package measured in several categories has one page, so its menu can
  // open at only one of them. The others are carried along, and a few lines
  // of script swap in the one the reader just came from.
  const alternates = (context.alternates ?? []).map((id) => `<template data-side="${esc(id)}">${categoryList({ ...context, category: id })}</template>`).join('')
  const swap = alternates
    ? `<script>(()=>{try{const n=document.currentScript.parentNode,w=sessionStorage.getItem('category'),t=w&&[...n.querySelectorAll('template[data-side]')].find(t=>t.dataset.side===w);if(t){n.querySelector('.side-categories').replaceChildren(t.content.cloneNode(true));n.dataset.category=w}}catch{}})()</script>`
    : ''
  const ecosystems = Object.entries(ECOSYSTEMS)
    .map(([id, eco]) => `<li><a href="${urls.ecosystem(id)}"${urls.ecosystem(id) === path ? ' aria-current="page"' : ''}>${inlineIcon(`eco-${id}`)}${esc(eco.title)} <span class="count">${ecosystemCount(model, id)}</span></a></li>`)
    .join('')
  return `<nav class="side" aria-label="Catalog"${context.category ? ` data-category="${esc(context.category)}"` : ''}>
<h2>${link('/categories/', 'Categories')}</h2>
<ul class="side-categories">${categoryList(context)}</ul>${alternates}${swap}
<h2>${link('/packages/', 'Packages')}</h2>
<ul>${ecosystems}</ul>
<h2>${link('/runtimes/', 'Languages/Runtimes')}</h2>
<ul>${byMedals(model).map((rt) => `<li><a href="${urls.runtime(rt.id)}"${urls.runtime(rt.id) === path ? ' aria-current="page"' : ''}>${inlineIcon(rt.id)}${esc(rt.title)}${sideMedals(model, rt.id)}</a></li>`).join('')}</ul>
<h2>${link('/stats/', 'Statistics')}</h2>
</nav>`
}

// A table's explanatory text is written as its <caption>, but shown beneath
// the table and outside the sideways scroll, so it stays put and readable.
// Several separate remarks under one table: each on its own line behind a
// circled number, so the eye can find where one ends and the next begins.
const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩'
const notes = (list) => `<span class="notes">${list.map((text, i) => `<span class="fn"><span class="n" aria-hidden="true">${CIRCLED[i]}</span><span>${text}</span></span>`).join('')}</span>`
const captionsBelow = (html) =>
  html.replace(/<div class="scroll">(<table\b[^>]*>)\s*<caption>([\s\S]*?)<\/caption>([\s\S]*?<\/table>)<\/div>/g, '<figure class="tablefig"><div class="scroll">$1$3</div><figcaption>$2</figcaption></figure>')

// The side menu lists at most this many packages or planned categories, then
// links to the full list, so it stays short however large the catalog gets.
const SIDE_LIMIT = 24

// `formats` says what else the page comes as. Every page has a Markdown
// version beside it (index.md); `data: true` adds results.csv and
// results.json for pages that list something. null leaves the menu out.
// `at` is the page's own address where `path` names another page (a version
// page keeps its package highlighted in the catalog).
function layout({ title, description, path, crumbs = [], context = {}, model, body, formats = { data: false }, actions = '' }) {
  const own = formats?.at ?? path
  if (formats) body = body.replace('<main>', `<main>\n${pageMenu({ markdown: `${own}index.md`, csv: formats.data ? `${own}results.csv` : null, json: formats.data ? (formats.json ?? `${own}results.json`) : null })}${actions}`)
  else if (actions) body = body.replace('<main>', `<main>\n${actions}`)
  body = captionsBelow(body)
  const trail = crumbs.length
    ? `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li>${crumbs.map(([text, href]) => `<li>${href ? `<a href="${href}">${esc(text)}</a>` : `<span aria-current="page">${esc(text)}</span>`}</li>`).join('')}</ol></nav>`
    : ''
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${siteMeta(model, { title, description, path, crumbs, markdown: formats && own ? `${own}index.md` : null })}
${ICON_LINKS()}
${FONTS}
<link rel="stylesheet" href="/styles.css">
<script type="module" src="/app.js"></script>
</head>
<body data-site="${esc(model.site?.url ?? '')}" data-repo="${esc(model.repository?.url ?? '')}">
<input type="checkbox" id="menu" class="menu-toggle" aria-label="Show the catalog menu">
<header class="top">
<label for="menu" class="menu-button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 3h14v2H1zM1 7h14v2H1zM1 11h14v2H1z" fill="currentColor"/></svg>Browse</label>
<a class="name" href="/">${LOGO()}Package Efficiency Labels</a>
<div class="search" role="search"><label for="q">Search</label><input id="q" type="search" role="combobox" aria-expanded="false" aria-controls="q-results" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Search packages, tasks and categories"><kbd class="search-key" hidden></kbd><ul id="q-results" role="listbox" aria-label="Search results" hidden></ul></div>
<nav aria-label="Indexes"><a href="/categories/">Categories</a><a href="/tasks/">Tasks</a><a href="/packages/">Packages</a><a href="/runtimes/">Languages/Runtimes</a><a href="/stats/">Statistics</a></nav>
</header>
<div class="frame">
${sidebar(model, path, context)}
<div class="content">
${trail}
${body}
<footer>
<p>Provisional. All results come from one developer laptop, not a reference machine. AI coding agents wrote the benchmark adapters, and most are not yet reviewed by a human; those that are carry a mark. This site is independent. It is not affiliated with the packages, registries, runtimes or compilers that it measures, and its labels are not an official rating. <a href="/credits/">Credits</a>.</p>
<p>All results: <a href="/data/results.csv">CSV</a>, <a href="/data/results.json">JSON</a>, <a href="/llms.txt">Markdown index for language models</a>.</p>
</footer>
</div>
</div>
</body>
</html>
`
}

// --- Shared pieces ----------------------------------------------------------

// A check beside a benchmark that someone other than its author has read and
// found correct: a blue badge when a maintainer of the package did, a grey
// white figure raising a hand, in a grey circle, when another person did. Nothing when it is not reviewed.
const CHECK_PATH = 'M5.65 2.32Q8.00 -0.05 10.35 2.32Q13.69 2.31 13.68 5.65Q16.05 8.00 13.68 10.35Q13.69 13.69 10.35 13.68Q8.00 16.05 5.65 13.68Q2.31 13.69 2.32 10.35Q-0.05 8.00 2.32 5.65Q2.31 2.31 5.65 2.32zM11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z'
// Another person's review has a different mark, not a tick: a figure raising
// a hand, drawn in white over this solid disc (solid, so the waving arm leaves no hole).
const ROUND_CHECK_PATH = 'M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z'
const REVIEWS = { maintainer: 'Verified by the package authors', human: 'Reviewed by a human' }
const reviewOf = (adapter) => (adapter?.review === 'maintainer' ? 'maintainer' : adapter?.review && adapter.review !== 'unreviewed' ? 'human' : null)
// The figure's forearm is a path of its own, so it can unfold at the elbow and wave when pointed at (see styles.css).
const verifiedMark = (kind, title) => `<span class="verified ${kind}" title="${esc(title)}"><svg viewBox="0 0 16 16" role="img" aria-label="${esc(REVIEWS[kind])}"><path d="${kind === 'maintainer' ? CHECK_PATH : ROUND_CHECK_PATH}" fill="currentColor" fill-rule="evenodd"/>${kind === 'maintainer' ? `<path d="M11.500 5.900L7.100 10.800 4.500 8.200l1.050-1.050 1.500 1.500 3.350-3.750z" fill="#fff"/>` : `<path d="M7.500 3.300a1.400 1.400 0 1 0 0 2.800 1.400 1.400 0 0 0 0-2.800zM6.100 6.500h2.650v6.600H7.900v-3.100h-.550v3.100H6.500V7.900h-.250v2.300H5.200V7.400a.900.900 0 0 1 .900-.900z" fill="#fff"/><path d="M8.750 6.500h1.880a.550.550 0 0 1 0 1.100H8.750z" fill="#fff"/><path class="wave-arm" d="M10.080 7.050V4.600h1.100v2.450a.550.550 0 0 1-1.100 0z" fill="#fff"/>`}</svg></span>`
function verified(adapter) {
  const kind = reviewOf(adapter)
  if (!kind) return ''
  const by = adapter.reviewed?.by ? ` (${adapter.reviewed.by}${adapter.reviewed.date ? `, ${adapter.reviewed.date}` : ''})` : ''
  return verifiedMark(kind, `${REVIEWS[kind]}${by}`)
}
// The check a package's own page carries beside its name: the review that
// every one of its benchmarks there has. One benchmark that is not reviewed
// leaves the name without one.
const reviewOfAll = (entries) => {
  const kinds = [...new Map(entries.map((e) => [adapterIdOf(e), reviewOf(e.adapter)])).values()]
  return kinds.length === 0 || kinds.some((kind) => !kind) ? null : kinds.every((k) => k === 'maintainer') ? 'maintainer' : 'human'
}
function verifiedAll(entries) {
  const kind = reviewOfAll(entries)
  if (!kind) return ''
  const kinds = new Set(entries.map(adapterIdOf))
  return verifiedMark(kind, kinds.size === 1 ? REVIEWS[kind] : `${REVIEWS[kind]}: all ${kinds.size} benchmarks`)
}
// The sentence that says who reviewed an adapter, with a link to the review.
function reviewText(adapter) {
  const kind = reviewOf(adapter)
  if (!kind) return 'not reviewed by a human'
  const who = kind === 'maintainer' ? `verified by the package authors` : 'reviewed by a human'
  const detail = [adapter.reviewed?.by, adapter.reviewed?.date].filter(Boolean).join(', ')
  const text = `${who}${detail ? ` (${esc(detail)})` : ''}`
  return `${verified(adapter)}${adapter.reviewed?.issue ? `<a href="${esc(adapter.reviewed.issue)}">${text}</a>` : text}`
}

// The two ways a reader can answer back, as buttons in the site's second
// colour: report a problem or suggest a change, and (for a package) say that
// it is theirs and review its benchmark. Both open a choice of GitHub issue
// forms, filled in with what the page is about (see app.js). On their own
// they are links to the list of forms.
const FEEDBACK_ICONS = {
  report: 'M2 2h12v9H8.500L5 14v-3H2zm5.250 2v4h1.500V4zm0 5v1.500h1.500V9z',
  vouch: CHECK_PATH,
}
function feedback(model, { scope, about, pkg, task, runtime, category, source, code, page, vouch = true, top = false }) {
  const forms = `${model.repository.url}/issues/new/choose`
  const data = { scope, about, package: pkg, task, runtime, category, source, code, page: `${model.site?.url ?? ''}${page}` }
  const attrs = Object.entries(data).filter(([, v]) => v).map(([k, v]) => ` data-fb-${k}="${esc(v)}"`).join('')
  const button = (act, text) => `<a class="act ${act}" data-act="${act}" href="${forms}"><svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="${FEEDBACK_ICONS[act]}" fill="currentColor" fill-rule="evenodd"/></svg>${text}</a>`
  // At the top of a page they sit beside its Copy page button, with short names.
  return `<p class="feedback${top ? ' beside-menu' : ''}"${attrs}>${button('report', top || scope === 'listed' ? 'Report or suggest' : 'Report a problem or suggest a change')}${vouch ? button('vouch', 'Is this package yours?') : ''}</p>`
}

const byRanking = (rankingId) => (a, b) => a.grades[rankingId].value - b.grades[rankingId].value || a.title.localeCompare(b.title)

// `older` marks an entry from a package's history rather than its latest version.
// `embed` names other addresses for the label's embeddable shapes and the
// page they link to: a package's best result has ones that follow the package.
function card({ entry, data, runtime, rankingId, model, caption, linkPackage = true, older = entry.activeRelease === false, place = '', embed }) {
  // A type-check figure with no class (the only package of its category that
  // has one) still gets its label, with no pointer. It has no file of its own
  // and no other shapes, so nothing to embed.
  const unclassed = rankingId === 'types' && !entry.grades.types && entry.types?.value != null
  if (unclassed) entry = { ...entry, grades: { ...entry.grades, types: { class: null, value: entry.types.value } }, adapter: { ...entry.adapter, notes: ['No class: it is the only package in its category with a type-check figure.', entry.adapter?.notes].filter(Boolean).join(' ') } }
  const svg = renderLabel({ entry, data, runtime, rankingId })
  if (!svg) return ''
  const pkg = model.packageOf(entry)
  // The label as a file of its own; the label menu copies and saves from it.
  const labelUrl = urls.label(data.task.id, runtime.id, entry.id, rankingId, older ? entry.version : null)
  embed ??= { base: urls.embedResult(data.task.id, runtime.id, entry.id, older ? entry.version : null, ''), page: urls.result(data.task.id, runtime.id, entry) }
  const lines = [
    caption && esc(caption),
    linkPackage && `<a href="${urls.package(pkg, entry.version !== pkg.version ? entry.version : null)}">${esc(pkg.title)}, all runtimes</a>`,
    `<a href="${urls.source(data.task.id, adapterIdOf(entry))}">Source</a>`,
    `<a href="${urls.result(data.task.id, runtime.id, entry)}">Permalink</a>`,
    `<a class="soft svg-link" href="${labelUrl}">SVG</a>`,
  ].filter(Boolean)
  if (unclassed) return `<li data-label><p class="over">${place}${variantTag(entry)}</p>${svg}<p class="under">${lines.filter((line) => !line.includes('svg-link')).join(' &nbsp; ')}</p></li>`
  return `<li${entry.reference ? ' data-reference-card' : ''} data-label="${esc(labelUrl)}" data-embed="${esc(embed.base)}" data-embed-page="${esc(embed.page)}" data-embed-alt="${esc(`Package efficiency of ${entry.title}`)}" data-ranking="${rankingId}" data-embed-rankings="${Object.keys(RANKINGS).filter((id) => entry.grades[id]).join(',')}" data-label-pattern="${esc(urls.label(data.task.id, runtime.id, entry.id, '{r}', older ? entry.version : null))}"><p class="over">${place}${variantTag(entry)}</p>${svg}<p class="under">${lines.join(' &nbsp; ')}</p></li>`
}

// Says, above its label, that an entry is not the package as installed: it
// runs with options changed from their defaults, or through another of the
// package's entry points.
function variantTag(entry) {
  const tags = entry.adapter?.tags ?? []
  if (tags.includes('non-default-options')) return `<span class="place variant" title="Runs with options changed from their defaults; see the note on the label">${WRENCH.replace(' role="img" aria-label="Tuned"', ' aria-hidden="true"')}Tuned</span>`
  if (tags.includes('different-entry-point')) return '<span class="place variant" title="Runs through another of the package\'s entry points; see the note on the label">Other entry point</span>'
  return ''
}

// A row of labels, in rank order. A short row wraps as a grid. A long one
// becomes a single strip that scrolls sideways, so the page stays compact and
// every label, best to worst, is still there. `limit: Infinity` keeps a grid.
const SHELF_LIMIT = 4
function shelf(cards, { limit = SHELF_LIMIT } = {}) {
  const items = cards.filter(Boolean)
  if (items.length === 0) return ''
  return `<ul class="shelf${items.length > limit ? ' strip' : ''}">${items.join('\n')}</ul>`
}

// Flips a group's label rows between best first and worst first (see app.js).
const orderSwitch = (name) => switcher(name, 'Show', [{ id: 'best', title: 'Best first' }, { id: 'worst', title: 'Last first' }], 'best')

const languageTitle = id => ({javascript:'JavaScript',python:'Python',ruby:'Ruby',go:'Go',rust:'Rust',all:'All'})[id] ?? id
const languageOf = id => id.startsWith('best-') ? id.slice(5) : id.startsWith('every-') ? id.slice(6) : ({node:'javascript',bun:'javascript',deno:'javascript',cpython:'python',pypy:'python',ruby:'ruby','ruby-yjit':'ruby',go:'go',rust:'rust'})[id]
function withBestRuntimes(runtimes) {
  return [...runtimes, ...(new Set(runtimes.map(r => languageOf(r.id))).size > 1 ? [{id:'best-all',title:'Best',language:'all',best:true}] : []), ...[...new Set(runtimes.map(r => languageOf(r.id)))].filter(language => runtimes.filter(r => languageOf(r.id) === language).length > 1).map(language => ({id:`best-${language}`,title:'Best',language,best:true,version:''}))]
}
// The choices of the task page's Runtime switch. Wherever there is more than
// one runtime to choose from (within a language, or across languages), two
// views come first: "All", every entry on every one of those runtimes, and
// "Best", each package on the runtime where it does best. Then the runtimes.
function runtimeViews(runtimes) {
  const languages = [...new Set(runtimes.map((r) => languageOf(r.id)))]
  const views = (language) => [
    { id: `every-${language}`, title: 'All', language, best: true, every: true, version: '' },
    { id: `best-${language}`, title: 'Best', language, best: true, version: '' },
  ]
  return [
    ...(languages.length > 1 ? views('all') : []),
    ...languages.flatMap((language) => {
      const own = runtimes.filter((r) => languageOf(r.id) === language)
      return [...(own.length > 1 ? views(language) : []), ...own]
    }),
  ]
}
// Every entry on every runtime of a language (or of all), best first.
function everyTaskEntry(runtimes, language, rankingId) {
  return runtimes
    .filter((r) => language === 'all' || languageOf(r.id) === language)
    .flatMap((runtime) => runtime.entries.filter((entry) => entry.grades[rankingId]).map((entry) => ({ ...entry, selectedRuntime: runtime })))
    .sort(byRanking(rankingId))
}
export function bestTaskEntries(runtimes, language, rankingId) {
  const winners = new Map()
  for (const runtime of runtimes.filter(r => language === 'all' || languageOf(r.id) === language)) for (const entry of runtime.entries) {
    if (!entry.grades[rankingId]) continue
    const previous = winners.get(entry.id)
    if (!previous || byRanking(rankingId)(entry,previous) < 0) winners.set(entry.id,{...entry, selectedRuntime:runtime})
  }
  return [...winners.values()].sort(byRanking(rankingId))
}

// A small picture of a class scale in one ranking's colours, with `bars`
// bars. Seven shows every class, for tiles; fewer, shallower bars still read
// at text size, and mark the "Rank by" tabs with the colours their labels use.
const SCALE_ICON_CLASSES = { 3: 'ADG', 4: 'ACEG', 5: 'ABDFG', 7: 'ABCDEFG' }
// Some class colours disappear on the yellow selection highlight: the CPU
// scale's yellow middle class, and the pale first class of the other two. While
// a tab is selected its three-bar icon uses the stronger neighbours named
// here instead (see `.scale path[style]` in styles.css).
const SCALE_ICON_SELECTED = { cpu: { 3: 'AFG' }, memory: { 3: 'CEG' }, types: { 3: 'BDG' } }
export function scaleIcon(rankingId, { attrs = 'class="ico scale"', bars = 3 } = {}) {
  const letters = [...SCALE_ICON_CLASSES[bars]]
  const selected = SCALE_ICON_SELECTED[rankingId]?.[bars]
  const [first, last, tip] = bars === 7 ? [12, 38.4, 3] : [20, 38, 4]
  const row = 40 / bars
  const half = row * 0.4
  const paths = letters.map((letter, i) => {
    const swap = selected && selected[i] !== letter ? ` style="--selected:${classColor(rankingId, selected[i])}"` : ''
    return `<path d="M0 ${(i * row).toFixed(2)}h${(first + (i * (last - first)) / (bars - 1)).toFixed(1)}l${tip} ${half.toFixed(2)}-${tip} ${half.toFixed(2)}H0z" fill="${classColor(rankingId, letter)}"${swap}/>`
  })
  return `<svg viewBox="0 0 44 40" ${attrs} aria-hidden="true">${paths.join('')}</svg>`
}

function switcher(name, legend, options, checked) {
  const languageIcons = name === 'runtime'
    ? ['javascript', 'python', 'ruby', 'go', 'rust'].map(id => `<template data-language-icon="${id}">${inlineIcon(id)}</template>`).join('')
    : ''
  // A plain group with a label, not a fieldset: browsers lay a fieldset's
  // legend out in their own way, which put the label on a line of its own.
  return `<div class="switch" role="radiogroup" aria-label="${esc(legend)}">${languageIcons}<span class="legend" aria-hidden="true">${esc(legend)}</span>${options
    .map(({ id, title, detail, icon = '' }) => `<input type="radio" name="${name}" id="${name}-${id}" value="${id}"${name === 'runtime' ? ` data-language="${languageOf(id)}"` : ''}${id === checked ? ' checked' : ''}><label for="${name}-${id}">${name === 'runtime' ? inlineIcon(id) : name === 'ranking' || name.startsWith('rank-') ? scaleIcon(id) : icon}${esc(title)}${detail ? `<small>${esc(detail)}</small>` : ''}</label>`)
    .join('')}</div>`
}

// The class boundaries of every ranking, as one table so the scales line up.
function legend(data) {
  const cells = (rankingId, metric, rowspan = 1) =>
    CLASSES.map((letter, i) => {
      const color = classColor(rankingId, letter)
      const unit = metric.absolute ? '' : '×'
      return `<td${rowspan > 1 ? ` rowspan="${rowspan}"` : ''} style="background:${color};color:${inkOn(color)}">${i === 6 ? `over ${metric.scale[5].toLocaleString('en-US')}${unit}` : `to ${metric.scale[i].toLocaleString('en-US')}${unit}`}</td>`
    }).join('')
  const typeRows = [
    ...Object.keys(data.compilers).map((id) => [
      `${id} ${esc(data.compilers[id])}`,
      `${id === 'tsgo' ? 'The TypeScript compiler written in Go. It uses the same project and runtime typings as tsc. CPU time includes all threads. Elapsed time is shown separately.' : 'Loads the package declarations. The baseline project and the package project both include the Node, Bun and Deno typings. skipLibCheck is on, so library declaration bodies are not checked.'}${id === data.typesCompiler ? ' This compiler sets the TypeScript class.' : ''}`,
      data.typeChecks.typescript,
    ]),
    ...['python', 'ruby', 'go'].filter(id => data.typeChecks[id]).map(id => [data.typeChecks[id].tool, ({python: 'Checks the adapter in strict mode, with annotated inputs and outputs and the library stubs. Incremental caching is off. The checker runs on CPython and targets Python 3.12 for both CPython and PyPy.', ruby: 'Checks the adapter against method signatures and Ruby interface files (RBI). Routing DSL values and JSON contents stay untyped: the check covers the adapter, not the framework. CRuby and YJIT share the result.', go: 'Parses and checks the adapter, and loads library type information. Dependencies are prepared first. Compilation, code generation and linking are not included.'})[id], data.typeChecks[id]]),
    ...(data.typeChecks.cargo ? [['cargo check', 'Checks the adapter again after its dependencies are checked, and subtracts an empty program. Each run checks the adapter from scratch. The CPU time of the first dependency check is shown separately.', data.typeChecks.cargo]] : []),
  ]
  const sharedTypeScale = typeRows.every(([, , metric]) => JSON.stringify(metric.scale) === JSON.stringify(typeRows[0][2].scale))
  return `<div class="scroll"><table class="legend">
<thead><tr><th scope="col" colspan="2">Ranking</th><th scope="col" class="l">What is measured</th>${CLASSES.map((letter) => `<th scope="col">${letter}</th>`).join('')}</tr></thead>
<tbody>
<tr><th scope="row" colspan="2">CPU</th><td class="l wrap">${esc(data.metrics.cpu.headline)}: user and system time on all threads. A class is a multiple of the best result.</td>${cells('cpu', data.metrics.cpu)}</tr>
<tr><th scope="row" colspan="2">Memory</th><td class="l wrap">The memory that the process holds after the task and a garbage collection (its physical footprint). The same runtime with a do-nothing adapter on the same inputs is subtracted. A class is a multiple of the best result.</td>${cells('memory', data.metrics.memory)}</tr>
${typeRows.map(([language, text, metric], i) => `<tr>${i === 0 ? `<th scope="rowgroup" rowspan="${typeRows.length}">Type check</th>` : ''}<th scope="row">${language}</th><td class="l wrap">${text}</td>${!sharedTypeScale ? cells('types', metric) : i === 0 ? cells('types', metric, typeRows.length) : ''}</tr>`).join('\n')}
</tbody></table></div>
<p class="soft">Type-check cost is one figure: the CPU time that the checker adds, multiplied by the memory that it adds, in ${ROOT_MB_MS}. Serverless platforms bill in the same unit. Each class boundary is the CPU boundary multiplied by the memory boundary. In the tables, the cost is the bold figure after its CPU time and its memory. Both are measured above the checker's baseline, which for TypeScript includes the shared runtime typings. A class compares an entry with the lowest-cost package in its category, in any language. Added CPU time below 10 ms counts as 10 ms, because smaller differences are noise. TypeScript reports heap memory. The other checkers report peak resident memory.</p>`
}

// --- Task page --------------------------------------------------------------

const unitOf = (data) => data.task.kind === 'sync-operation' || data.task.kind === 'async-operation' ? 'operation' : data.task.kind === 'server-startup' ? 'start' : 'request'
// A startup task's figure is the CPU time of one launch, in milliseconds;
// every other task's is per operation or request, in microseconds.
const cpuOf = (m) => m.startupCpuMs ?? m.cpuPerOperationUs ?? m.cpuPerRequestUs
const cpuUnit = (m) => (m.startupCpuMs != null ? ' ms' : ' µs')
const rateOf = (m) => (m.startupCpuMs != null ? null : m.operationsPerCpuSecond ?? m.requestsPerCpuSecond)

function rankingTable(data, runtime, entries, model) {
  const isRust = runtime.id === 'rust'
  const isNative = ['python', 'ruby', 'go'].includes(runtime.language)
  const isAll = runtime.language === 'all'
  const compilers = (runtime.language ?? 'javascript') === 'javascript' ? Object.keys(data.compilers) : []
  const markOf = marker(entries.map((e) => ({ data, entry: e, row: e })), 'entries')
  const rows = entries.map((e) => {
    const m = e.metrics
    const growth = e.flags.includes('grows-with-use') ? ` (+${formatNumber(m.leakBytesPerOperation ?? m.leakBytesPerRequest)} B per ${unitOf(data)})` : ''
    const mark = (key) => markOf([{ data, entry: e }], key)
    const typeCells = isRust
      ? typeCost(e.types, e.grades.types) + cell(e.types?.coldCpuS, num(e.types?.coldCpuS, ' s'))
      : isAll ? typeCost(e.types?.compilers?.[data.typesCompiler] ?? e.types, e.grades.types) : isNative ? typeCost(e.types, e.grades.types) : compilers.map((id) => typeCost(e.types?.compilers[id])).join('')
    const marks = medalBadges(['cpu', 'memory', ...(isRust || isAll || isNative ? ['types'] : compilers)].map(mark))
    return `<tr${e.reference ? ' data-reference' : ''}><td><a href="${urls.package(model.packageOf(e))}">${esc(e.title)}</a>${verified(e.adapter)}<span class="ver">${e.builtin ? 'built in' : esc(e.version ?? '')}</span>${marks}</td>
${isAll ? `<td class="l">${esc(languageTitle(languageOf(e.selectedRuntime.id)))}</td>` : ''}
${runtime.best ? `<td class="l">${inlineIcon(e.selectedRuntime.id)}${esc(e.selectedRuntime.title)}</td>` : ''}
${gradedCell(e.grades.cpu, `${num(cpuOf(m), cpuUnit(m), LEAST.cpu)}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `<span class="memory-cost"><span>${num(m.memoryMb, ' MB', LEAST.memory)}</span><span class="memory-cost-grade">${chip('memory', e.grades.memory)}</span><span class="memory-cost-detail">${num(m.settledRssMb, ' MB')} total after GC</span><span class="memory-cost-detail">${num(m.peakRssMb, ' MB')} lifetime peak</span></span>`)}
${cell(m.heapAboveBaselineKb, num(m.heapAboveBaselineKb, ' KB'))}
${isRust ? cell(m.heapPeakMb, num(m.heapPeakMb, ' MB')) : cell(m.retainedKb, num(m.retainedKb, ' KB') + growth)}
${isRust ? '' : cell(m.importMs, num(m.importMs, ' ms'))}
${typeCells}
${cell(rateOf(m), num(rateOf(m)))}
${cell((m.throughputOps ?? m.throughputRps), num((m.throughputOps ?? m.throughputRps)))}
${cell(m.latencyP99Ms, num(m.latencyP99Ms, ' ms'))}
<td class="l"><a href="${urls.source(data.task.id, adapterIdOf(e))}">Source</a></td></tr>`
  })
  const typeHeads = isRust
    ? sortableTypes('cargo check') + sortable('cargo check, first run, CPU')
    : isAll ? sortableTypes('Type check') : isNative ? sortableTypes(`Type check, ${esc(data.typeChecks[runtime.language]?.tool ?? runtime.language)}`) : compilers.map((id) => sortableTypes(`Type check, ${id} ${esc(data.compilers[id])}`)).join('')
  return `<div class="scroll"><table class="sortable">
<caption>${runtime.every ? 'Every entry on every runtime of the selected languages. Each row shows the figures from its own runtime. Package memory is the amount above the runtime baseline. The total, runtime included, is below it.' : runtime.best ? 'The best runtime for each package, for the selected ranking and languages. The other figures in a row come from the same runtime. Package memory is the amount above the runtime baseline. The total, runtime included, is below it.' : `All figures are for ${esc(runtime.title)} ${esc(runtime.version)}. Package memory is the memory that the process holds after the last round and a garbage collection, above the ${esc(runtime.title)} baseline. Below it are the total after the task and the lifetime peak. The peak has no class. Runtime labels use the total. These figures include JIT code and allocator memory that the process still holds. They are not live heap size. ${data.task.kind === 'sync-operation' ? 'Throughput is the wall-clock speed of a batch. Latency per operation is not measured.' : 'Throughput and latency depend on the load generator and have no class.'} Heap over baseline uses the accounting of the runtime (baseline ${num(runtime.baselineHeapKb, ' KB')}): ${esc(runtime.heapDescription)} Do not compare heap figures between engines.`}</caption>
<thead><tr><th scope="col">Package</th>
${isAll ? sortable('Language', ' class="l"') : ''}${runtime.best ? sortable('Runtime', ' class="l"') : ''}${sortableGraded(`CPU per ${unitOf(data)}`)}${sortableGraded('Memory')}${sortable('Heap over baseline')}${sortable(isRust ? 'Peak heap, exact' : 'Heap retained after load')}
${isRust ? '' : sortable('Import time')}
${typeHeads}
${sortable(`${unitOf(data)}s per CPU-second`)}${sortable(`Throughput, ${unitOf(data)}s/s`)}${sortable('Latency, p99')}<th scope="col" class="l">Benchmark</th>
</tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table></div>
${TYPE_KEY}`
}

function anchorNote(data, runtime, rankingId, entries) {
  const metric = metricFor(data, entries[0], rankingId)
  if (rankingId === 'types') {
    const { anchor } = metric
    const holder = anchor ? ` The lowest-cost package in the category${anchor.category ? ` (${esc(anchor.category)})` : ''}, in any language, sets class A. It can be a package that is not in this task. Built-ins add nothing and are not counted. Here it is ${esc(anchor.title)}${anchor.version ? ` ${esc(anchor.version)}` : ''}, checked with ${esc(anchor.tool)}, at ${formatNumber(anchor.value)}.` : ''
    const how = runtime.language === 'all'
      ? 'Each language has its own checker, and the checkers do different amounts of work. The comparison shows what type checking costs in each ecosystem. It does not show which checker is better.'
      : `Measured with ${esc(metric.tool)}${metric.notes ? `: ${esc(metric.notes)}` : '.'}`
    return `<p class="note">Type-check cost is the CPU time that the checker adds, multiplied by the memory that it adds. Added CPU time below 10 ms counts as 10 ms.${holder} ${how}</p>`
  }
  const { anchor } = metric
  const best = entries[0]
  const holder = `${esc(anchor.title)}${anchor.version ? ` ${esc(anchor.version)}` : ''} on ${esc(anchor.runtime)}`
  const times = Math.max(best.grades[rankingId].value, metric.floor) / anchor.value
  // "All" and "Best" are views over several runtimes, not a runtime.
  const gap = runtime.best
    ? (times < 1.05 ? 'The best entry shown here is equal to it.' : `The best entry shown here, ${esc(best.title)} on ${esc(best.selectedRuntime?.title ?? '')}, uses ${formatNumber(times)} times as much.`)
    : times < 1.05 ? `${esc(runtime.title)} is equal to it.` : `The best on ${esc(runtime.title)}, ${esc(best.title)}, uses ${formatNumber(times)} times as much.`
  return `<p class="note">The best result in any language sets class A: ${holder}, at ${formatNumber(anchor.value)} ${esc(metric.headline)}. ${gap}</p>`
}

// It opens on its widest view: every language and every runtime where there
// are several, which is the first of the views.
function explorer(data, model) {
  // The labels are switched only between the rankings. The language and
  // runtime switches belong to the table and filter nothing else, as on a
  // category page.
  const panels = []
  const rules = []
  const runtimes = runtimeViews(data.runtimes)
  for (const runtime of runtimes) {
    const entries = runtime.every ? everyTaskEntry(data.runtimes, runtime.language, 'cpu') : runtime.best ? bestTaskEntries(data.runtimes, runtime.language, 'cpu') : runtime.entries.filter((e) => e.grades.cpu).sort(byRanking('cpu'))
    rules.push(`.explorer:has(#runtime-${runtime.id}:checked) .panel[data-runtime="${runtime.id}"]`)
    panels.push(`<section class="panel" data-runtime="${runtime.id}" aria-label="Every figure on ${esc(runtime.title)}">
${entries.length ? rankingTable(data, runtime, entries, model) : `<p class="note">There are no figures for ${esc(runtime.title)}.</p>`}
</section>`)
  }
  const hasReference = data.runtimes.some((rt) => rt.entries.some((e) => e.reference))
  return `${taskLabels(data, model, { all: true })}
<div class="explorer">
<style>${rules.join(',')}{display:block}</style>
<div class="switches">
${switcher('runtime', 'Runtime', runtimes.map((r) => ({ id: r.id, title: r.title, detail: r.version })), runtimes[0].id)}
${hasReference ? switcher('reference-table', 'Reference items', [{ id: 'shown', title: 'Show' }, { id: 'hidden', title: 'Hide' }], 'shown') : ''}
</div>
${panels.join('\n')}
</div>`
}

export function taskPage(data, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const authors = new Set(data.runtimes.flatMap((r) => r.entries.map((e) => `${e.adapter.author.agent ?? e.adapter.author.kind} (${e.adapter.author.model ?? 'no model recorded'})`)))
  const load = data.task.load
  return layout({
    title: `${data.task.title}: Package Efficiency Labels`,
    description: data.task.summary,
    path: urls.task(data.task.id),
    formats: { data: true, json: `/data/${data.task.id}.json` },
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.taxonomy, model), [category.title, urls.category(category.id)], [data.task.title]],
    model,
    body: `<main>
<h1>${esc(data.task.title)}</h1>
<p class="intro">${esc(data.task.summary)} A class compares an entry with the best result in any language or runtime, so a class means the same on every tab.${data.runtimes.some((rt) => rt.entries.some((e) => e.reference)) ? ' Reference items, marked R, are there for comparison only: they have no class and win no medal, and no class is set against them.' : ''}</p>
${explorer(data, model)}

<h2 id="runtimes">Languages and runtimes compared on this task</h2>
${runtimeSection([data], model, data.task.title)}

<h2>Reading a label</h2>
${legend(data)}
<p>${data.task.kind === "http-server" ? "The CPU classes are narrow because these servers are close together. Narrower classes would be smaller than the variation between runs. " : "A CPU class is a multiple of the lowest CPU cost per operation. "}Import time is on the label but has no class.</p>

<h2>How this was measured</h2>
<ul>
${data.task.kind === 'sync-operation' || data.task.kind === 'async-operation' ? `<li>${esc(data.task.summary)} There are ${data.task.fixtureCount ?? 0} fixture cases. Each case is checked before measurement starts.</li>
<li>Every entry gets the same time, whatever one operation costs. First comes a warm-up of ${load.warmup.toLocaleString('en-US')} operations or two seconds, whichever ends first. Then comes one unmeasured rehearsal of ${load.rounds} rounds in the same process. Then come ${load.rounds} measured rounds of at least ${load.minRoundMs} ms each. A round is a whole number of passes over the fixtures. Each round records how many operations it completed, and costs are per operation. A figure is the median of the rounds, then the median of the process runs. This task uses ${[...new Set(data.runtimes.flatMap((r) => r.entries.map((e) => e.measurement.runs)))].join(', ')} runs per entry.</li>
<li>CPU time is measured inside the child process. An adapter can prepare each fixture once before measurement, so an entry does not pay to read its input. Fixture preparation, correctness checks, messages to the harness and forced garbage collection are not measured. Each result is added to a checksum, so the work cannot be skipped.</li>` : `${data.task.kind === 'server-startup' ? `<li>${esc(data.task.summary)}</li>
<li>Each sample starts a new process. The time runs from the launch to the first page that comes back correct, and the CPU figure is all the CPU time the process used by then. There are ${load.launches} launches in a run. A figure is the median of the launches, then the median of the runs.</li>
<li>Memory is read after that first page, above the same runtime with no application.</li>` : `<li>${load.workers * load.connections} keep-alive connections send the requests of the task in turn.</li>
<li>First come ${load.warmup.toLocaleString('en-US')} warm-up requests. Then comes one unmeasured rehearsal of ${load.rounds} rounds in the same process. Then come ${load.rounds} measured rounds of ${load.requestsPerRound.toLocaleString('en-US')} requests. A figure is the median of the rounds, then the median of the process runs.</li>
<li>Before measurement starts, each response is checked for the correct status, content type and body.</li>`}`}
<li>Runtimes with a garbage collector collect after each round. Memory is read after a short rest, so that memory the runtime releases late is not counted. Rust frees temporary allocations as usual and reports its live and peak allocations. If the heap grows from round to round, the label says so.</li>
${data.task.notes ? `<li>${esc(data.task.notes)}</li>` : ""}
<li>An entry is listed on a runtime only if it runs there and passes the checks of the task.</li>
${notPassing(data)}
${data.task.kind === "http-server" ? "<li>By default, Rust and Go servers use every core and JavaScript servers use one. For this reason throughput has no class. The one-thread variants of the Rust and Go servers are listed beside them.</li><li>An entry with the name of a package runs that package as installed. A tuned variant changes one setting from a fixed list (worker threads, or one application thread), and its name says which.</li>" : ""}
<li>Machine: ${esc(data.machine.cpu)}, ${data.machine.cores} cores, ${esc(data.machine.os)}.</li>
<li>${esc([...authors].join(', '))} wrote the adapters. ${(() => { const all = data.runtimes.flatMap((r) => r.entries); const by = (kind) => new Set(all.filter((e) => reviewOf(e.adapter) === kind).map(adapterIdOf)).size; const m = by('maintainer'), h = by('human'); return m + h === 0 ? 'No human and no package maintainer has reviewed them.' : `${m ? `The authors of the package verified ${m}. ` : ''}${h ? `Another person reviewed ${h}. ` : ''}The others are not reviewed.` })()} A blue check marks a benchmark that the authors of the package verified, and a grey reviewer mark one that another person reviewed.</li>
</ul>

<h2>Benchmark source</h2>
<p>The rules of the task, its load settings, and the scenario that checks every adapter. The adapter of each entry is on its package page and behind the Source link under its label. The <a href="${repoUrl(model, 'tree', 'harness')}">measuring harness</a> is on GitHub.</p>
${feedback(model, { scope: 'task', about: data.task.title, task: data.task.id, source: `benchmarks/${data.task.id}`, code: urls.source(data.task.id), page: urls.task(data.task.id), vouch: false })}
${taskSource(data.task.id).map((f) => sourceFile(f, model, { open: false, id: `source-${f.name}` })).join('\n')}
</main>`,
  })
}

// --- Package page -----------------------------------------------------------

function typeDetail(data, entry) {
  // A figure from a sweep of whole packages (scripts/sweep-types/).
  if (entry.types.swept) return `<p>Measured with ${esc(entry.types.tool)}: a program that only loads the package is checked, and the same check of an empty program is subtracted. The package adds ${formatNumber(entry.types.cpuMs)} ms of CPU time and ${formatNumber(entry.types.memoryMb)} MB of memory.${entry.types.community ? ` The types come from a community package${entry.types.from ? ` (${esc(entry.types.from)})` : ''}, not from the authors of this package.` : ''}</p>`
  if (entry.types.metricKey) return `<p>Measured with ${esc(entry.types.tool)} ${esc(entry.types.version)}: ${esc(entry.types.notes)} The workload and the baseline each run eleven times, each time in a new process. The package adds ${formatNumber(entry.types.cpuMs)} ms of CPU time, ${formatNumber(entry.types.timeMs)} ms of elapsed time and ${formatNumber(entry.types.memoryMb)} MB of peak resident memory. A figure below the baseline counts as zero. Added CPU time below 10 ms counts as 10 ms.</p>`
  if (entry.types.tool === 'cargo') {
    return `<p>Measured with ${esc(data.typeChecks.cargo.tool)}. The first check of the crate and its dependencies takes ${formatNumber(entry.types.coldCpuS)} s of CPU time. A second check of the adapter adds ${formatNumber(entry.types.cpuMs)} ms of CPU time, ${formatNumber(entry.types.timeMs)} ms of elapsed time and ${formatNumber(entry.types.memoryMb)} MB, compared with an empty program.</p>`
  }
  const rows = Object.entries(entry.types.compilers)
    .filter(([, c]) => c)
    .map(([id, c]) => `<tr><td>${id} ${esc(data.compilers[id])}</td>${cell(c.cpuMs, `${formatNumber(c.cpuMs)} ms CPU`)}${cell(c.timeMs, `${formatNumber(c.timeMs)} ms`)}${cell(c.memoryMb, `${formatNumber(c.memoryMb)} MB`)}${cell(c.score, `${formatNumber(c.score)} MB·s${chip('types', c)}`)}${cell(c.symbols, c.symbols.toLocaleString('en-US'))}${cell(c.files, c.files)}</tr>`)
  return `<div class="scroll"><table class="narrow sortable">
<caption>The types come from ${esc(entry.types.from === 'bundled' ? 'the package itself' : entry.types.from)}. For both compilers, a class compares the entry with the lowest-cost package in its category, in any language.</caption>
<thead><tr><th scope="col">Compiler</th><th scope="col">CPU added</th><th scope="col">Elapsed added</th><th scope="col">Memory added</th><th scope="col">Cost</th><th scope="col">Symbols</th><th scope="col">Files</th></tr></thead>
<tbody>${rows.join('')}</tbody></table></div>
${TYPE_KEY}`
}

// Every measured version of a package in one task, newest first. Only the
// latest is ranked; the others show how the package has changed.
function versionHistory(pkg, data, viewing) {
  const older = pkg.history.filter((a) => a.data === data)
  if (older.length === 0 && new Set(pkg.appearances.map(a=>a.entry.version)).size < 2) return ''
  const latest = pkg.appearances.filter((a) => a.data === data)
  const all = [...latest.map((a) => ({ ...a, ranked: true })), ...older].sort(
    (a, b) => b.entry.version.localeCompare(a.entry.version, 'en', { numeric: true }) || data.runtimes.indexOf(a.runtime) - data.runtimes.indexOf(b.runtime),
  )
  const markOf = marker(all.map((a) => ({ data, entry: a.entry, row: a })), 'results')
  return `<h3>Versions</h3>
<div class="scroll"><table class="sortable">
<caption>Every measured version, on the same scale. Rankings use only current full releases. The default is ${esc(pkg.version)}.</caption>
<thead><tr><th scope="col">Version</th><th scope="col" class="l">Runtime</th>${[`CPU per ${unitOf(data)}`, 'Memory', 'Heap retained after load', 'Import time'].map((t, i) => sortable(t, i === 0 ? ' class="marked" aria-sort="ascending"' : i < 2 ? ' class="marked"' : '')).join('')}</tr></thead>
<tbody>${[...all].sort(byCpu)
    .map(({ runtime, entry: e, ranked }) => `<tr${e.version === viewing ? ' class="here"' : ''}><td><a href="${urls.package(pkg, e.version===pkg.version ? null : e.version)}">${esc(e.version)}</a>${ranked ? '<span class="ver">ranked</span>' : ''}${medalBadges(['cpu', 'memory'].map((key) => markOf([{ data, entry: e }], key)))}</td><td class="l">${inlineIcon(runtime.id)}${esc(runtime.title)}</td>
${gradedCell(e.grades.cpu, `${num(cpuOf(e.metrics), cpuUnit(e.metrics), LEAST.cpu)}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `${num(e.metrics.memoryMb, ' MB', LEAST.memory)}${chip('memory', e.grades.memory)}`)}
${cell(e.metrics.retainedKb, num(e.metrics.retainedKb, ' KB'))}
${cell(e.metrics.importMs, num(e.metrics.importMs, ' ms'))}</tr>`)
    .join('\n')}</tbody></table></div>`
}

// A package's tables open with its best CPU result first.
const byCpu = (a, b) => (cpuOf(a.entry.metrics) ?? Infinity) - (cpuOf(b.entry.metrics) ?? Infinity)

// The package at its best in a task: the runtime and entry with the lowest
// CPU cost, then the least memory.
export const bestResult = (rows) => [...rows].sort((a, b) => byCpu(a, b) || a.entry.metrics.memoryMb - b.entry.metrics.memoryMb)[0]

// All measured versions of a package, newest first.
export const versionsOf = (pkg) =>
  [...new Set([pkg.version, ...pkg.appearances.map(a=>a.entry.version), ...pkg.history.map((a) => a.entry.version)].filter(Boolean))].sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))

// `version` selects an earlier version; without it the page is for the latest.
export function packagePage(pkg, model, version = pkg.version) {
  // Shared applications already shown on this page (see inlineSource).
  const shownApps = new Set()
  const eco = ECOSYSTEMS[pkg.ecosystem]
  const older = version !== pkg.version
  const shown = [...pkg.appearances,...pkg.history].filter(a=>a.entry.version===version)
  const failures = model.tasks.flatMap(data=>data.runtimes.flatMap(runtime=>(runtime.unsupported??[]).filter(e=>e.ecosystem===pkg.ecosystem&&e.package===pkg.name&&e.version===version).map(entry=>({runtime,entry}))))
  const versions = versionsOf(pkg)
  const versionNav =
    versions.length > 1
      ? `<nav class="versions" aria-label="Versions"><b>Version</b>${versions.map((v) => `<a href="${urls.package(pkg, v === pkg.version ? null : v)}"${v === version ? ' aria-current="page"' : ''}>${esc(v)}${v === pkg.version ? '<small>default</small>' : pkg.appearances.some(a=>a.entry.version===v) ? `<small>${/-/.test(v) ? 'pre-release' : 'also current'}</small>` : ''}</a>`).join('')}</nav>`
      : ''
  // A package measured both as installed and with tuned settings shows one
  // of the two at a time, chosen by the Settings switch under the title.
  const asInstalled = (a) => a.entry.name === a.entry.package
  let hasSettings = false
  const sections = model.tasks
    .map((data) => {
      const every = shown.filter((a) => a.data === data)
      if (every.length === 0) return ''
      const both = every.some(asInstalled) && !every.every(asInstalled)
      hasSettings ||= both
      const views = both ? [['tuned', every.filter((a) => !asInstalled(a))], ['installed', every.filter(asInstalled)]] : [['', every]]
      return `<section>
<h2><a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a></h2>
${views.map(([view, rows]) => (view ? `<div class="settings-view" data-settings="${view}">\n${section(data, rows, view)}\n</div>` : section(data, rows, view))).join('\n')}
</section>`
    })
    .join('\n')
  function section(data, rows, view) {
      // One row of labels at a time, best first, with the same Rank by and
      // Show switches as everywhere else labels are listed.
      const rankName = `rank-${data.task.id.replace(/[^a-z0-9]+/gi, '-')}${view && `-${view}`}`
      const labelsFor = (rankingId) => {
        const ranked = rows
          .filter((a) => a.entry.grades[rankingId])
          .sort((a, b) => CLASSES.indexOf(a.entry.grades[rankingId].class) - CLASSES.indexOf(b.entry.grades[rankingId].class) || a.entry.grades[rankingId].ratio - b.entry.grades[rankingId].ratio)
        // Each label's place among this package's own results in the task.
        const place = placeTags(ranked, (a) => `${a.entry.grades[rankingId].class} ${formatNumber(a.entry.grades[rankingId].value)}`)
        return shelf(ranked.map((a) => card({ entry: a.entry, data, runtime: a.runtime, rankingId, model, caption: a.runtime.title, linkPackage: false, older: !a.entry.activeRelease, place: place(a) })), { limit: Infinity })
      }
      // The package at its best in this task: the runtime and entry with the
      // lowest CPU cost (then memory), with all three of its labels in a row.
      const best = bestResult(rows)
      // Embedded from the package's own address, the labels of its best
      // result go on showing its best, whichever runtime that becomes.
      const embed = !older && best === bestResult(shown.filter((a) => a.data === data)) ? { base: urls.embed(data.task.id, pkg, ''), page: urls.package(pkg) } : undefined
      const bestRow = `${rows.length > 1 ? `<h3>Best result</h3>\n<p class="soft">${esc(best.entry.title)} on ${esc(best.runtime.title)} ${esc(best.runtime.version)}: the lowest CPU cost of the ${plural(rows.length, 'result')} here. <a href="${urls.result(data.task.id, best.runtime.id, best.entry)}">Permalink</a>.</p>\n` : ''}${shelf(Object.keys(RANKINGS).map((rankingId) => card({ entry: best.entry, data, runtime: best.runtime, rankingId, model, linkPackage: false, older: !best.entry.activeRelease, embed })))}`
      const perRanking =
        rows.length === 1
          ? ''
          : rows.length > 1
          ? `<div class="ranked">
<style>${['cpu', 'memory'].map((id) => `.ranked:has(#${rankName}-${id}:checked) .ranked-panel[data-ranking="${id}"]`).join(',')}{display:block}</style>
<div class="switches">${switcher(rankName, 'Rank by', ['cpu', 'memory'].map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}${orderSwitch(`order-${rankName}`)}</div>
${['cpu', 'memory'].map((id) => `<div class="ranked-panel" data-ranking="${id}">${labelsFor(id)}</div>`).join('\n')}
</div>`
          : ['cpu', 'memory'].map((id) => `<h3>${esc(RANKINGS[id].title)}</h3>${labelsFor(id)}`).join('\n')
      // The type-check figure does not depend on the runtime, so show each adapter's once.
      const typed = [...new Map(rows.filter((a) => a.entry.grades.types).map((a) => [a.entry.id, a])).values()].slice(0, 1)
      const typeSection = typed
        .map(({ entry, runtime }) => `<h3>Type check</h3>${entry.id === best.entry.id ? '' : shelf([card({ entry, data, runtime, rankingId: 'types', model, linkPackage: false })])}${typeDetail(data, entry)}`)
        .join('')
      const markOf = marker(rows.map((a) => ({ data, entry: a.entry, row: a })), 'results')
      const table = `<div class="scroll"><table class="sortable">
<caption>${esc(pkg.title)} in ${esc(data.task.title)}, on every runtime that runs it.</caption>
<thead><tr><th scope="col">Runtime</th><th scope="col" class="l">Entry</th>${[`CPU per ${unitOf(data)}`, 'Memory', 'Heap retained after load', 'Import time', `${unitOf(data)}s per CPU-second`, 'Latency, p99'].map((t, i) => sortable(t, i === 0 ? ' class="marked" aria-sort="ascending"' : i < 2 ? ' class="marked"' : '')).join('')}</tr></thead>
<tbody>${[...rows].sort(byCpu)
        .map(({ runtime, entry: e }) => `<tr><td>${esc(runtime.title)}<span class="ver">${esc(runtime.version)}</span>${medalBadges(['cpu', 'memory'].map((key) => markOf([{ data, entry: e }], key)))}</td><td class="l">${esc(e.title)}</td>
${gradedCell(e.grades.cpu, `${num(cpuOf(e.metrics), cpuUnit(e.metrics), LEAST.cpu)}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `${num(e.metrics.memoryMb, ' MB', LEAST.memory)}${chip('memory', e.grades.memory)}`)}
${cell(e.metrics.retainedKb, num(e.metrics.retainedKb, ' KB'))}
${cell(e.metrics.importMs, num(e.metrics.importMs, ' ms'))}
${cell(rateOf(e.metrics), num(rateOf(e.metrics)))}
${cell(e.metrics.latencyP99Ms, num(e.metrics.latencyP99Ms, ' ms'))}</tr>`)
        .join('\n')}</tbody></table></div>`

      // The package as installed first, then its tuned variants.
      const adapters = [...new Map(rows.map((a) => [a.entry.id, a.entry])).values()].sort((a, b) => (a.name !== a.package) - (b.name !== b.package))
      const adapterList = adapters
        .map((e) => {
          const a = e.adapter
          const who = a.author.kind === 'human' ? 'a human' : `${a.author.agent} (${a.author.model})`
          const reviewed = reviewText(a)
          const runtimeNotes = [...new Map(rows.filter((row) => row.entry.id === e.id).map((row) => [row.runtime.id, row.runtime])).values()]
            .filter((runtime) => a.runtimeNotes?.[runtime.id])
            .map((runtime) => `${esc(runtime.title)}: ${esc(a.runtimeNotes[runtime.id])}`)
            .join(' ')
          return `<div class="adapter"><p>${esc(e.title)}: written by ${esc(who)} on ${esc(a.author.date)}, ${reviewed}.${a.dependencies.length ? ` Measured with ${esc(a.dependencies.join(', '))}.` : ''}${a.notes ? ` ${esc(a.notes)}` : ''}${runtimeNotes ? ` ${runtimeNotes}` : ''}</p>
${feedback(model, { scope: 'entry', about: `${e.title} in ${data.task.title}`, pkg: `${pkg.ecosystem}/${pkg.name}`, task: data.task.id, source: adapterSource(data.task.id, adapterIdOf(e)).dir, code: urls.source(data.task.id, adapterIdOf(e)), page: urls.package(pkg, older ? version : null), vouch: pkg.ecosystem !== 'builtin' })}
${inlineSource(data.task.id, adapterIdOf(e), model, { shownApps, withShared: !adapters.some((other) => adapterIdOf(other) === adapterSource(data.task.id, adapterIdOf(e)).variantOf) })}</div>`
        })
        .join('')
      return `${bestRow}
${table}
${versionHistory(pkg, data, version)}
${rows.length > 1 ? '<h3>Every result</h3>' : ''}
${perRanking}
${typeSection}
<h3>Benchmark source</h3>
${adapterList}`
  }

  const runsOn = [...new Set(shown.map((a) => a.runtime.title))]
  const status = older ? (pkg.appearances.some(a=>a.entry.version===version) ? `${/-/.test(version) ? 'A pre-release, measured with the default' : 'A second current release line, measured with the default'}; the default is ${esc(pkg.version)}.` : `An earlier version. It is not in the rankings. The default full release is ${esc(pkg.version)}.`) : versions.length > 1 ? 'The default full release. Rankings use this version.' : ''
  return layout({
    title: `${pkg.title}${version ? ` ${version}` : ''}: Package Efficiency Labels`,
    description: `Efficiency labels for ${pkg.title}${version ? ` ${version}` : ''} on ${runsOn.join(', ')}.`,
    // Earlier versions keep the package highlighted in the catalog tree.
    path: urls.package(pkg),
    formats: older ? { data: false, at: urls.package(pkg, version) } : { data: true },
    context: { category: pkg.appearances[0].data.task.category, alternates: [...new Set(pkg.appearances.map((a) => a.data.task.category))].slice(1) },
    crumbs: [['Packages', '/packages/'], [eco.title, urls.ecosystem(pkg.ecosystem)], ...(older ? [[pkg.title, urls.package(pkg)], [version]] : [[pkg.title]])],
    model,
    actions: feedback(model, { scope: 'package', about: pkg.title, pkg: `${pkg.ecosystem}/${pkg.name}`, category: pkg.appearances[0]?.data.task.category, page: urls.package(pkg, older ? version : null), vouch: pkg.ecosystem !== 'builtin' , top: true }),
    body: `<main>
<h1>${esc(pkg.title)}${verifiedAll(shown.map((a) => a.entry))}${version ? ` <span class="ver">${esc(version)}</span>` : ''}</h1>
<p class="intro">${pkg.ecosystem === 'builtin' ? 'Built into its runtime' : `${esc(eco.title)} package`}. Measured on ${esc(runsOn.join(', '))} in ${plural(new Set(shown.map((a) => a.data)).size, 'task')}. ${status}${eco.registry ? ` <a href="${eco.registry(pkg.module ?? pkg.name)}">View on the registry</a>.` : ''}</p>

${versionNav}
${hasSettings ? `<div class="switches package-settings">${switcher('settings', 'Settings', [{ id: 'tuned', title: 'Tuned', icon: WRENCH.replace('role="img" aria-label="Tuned"', 'aria-hidden="true"') }, { id: 'installed', title: 'As installed' }], 'tuned')}</div>` : ''}
${failures.length ? `<section class="compatibility" aria-label="Benchmark compatibility">${failures.map(({runtime,entry})=>`<div class="compatibility-item"><p><strong>${esc(runtime.title)} unavailable.</strong> ${esc(entry.notes ?? 'This version of the package did not complete the task on this runtime.')}</p><details><summary>Details</summary><pre>${esc(entry.error)}</pre></details></div>`).join('')}</section>` : ''}
${sections}
</main>`,
  })
}

// --- Lists ------------------------------------------------------------------

// Entries that were tried and are not listed: the same entry usually fails
// the same way on several runtimes, so those are folded into one line.
function notPassing(data) {
  const seen = new Map()
  for (const runtime of data.runtimes) for (const entry of runtime.unsupported ?? []) {
    const key = `${entry.title}@${entry.version}`
    if (!seen.has(key)) seen.set(key, { entry, runtimes: [] })
    seen.get(key).runtimes.push(runtime.title)
  }
  return [...seen.values()].map(({ entry, runtimes }) => {
    const what = entry.status === 'verify-failed' ? "does not pass the checks of the task" : 'does not run'
    const why = String(entry.error ?? '').split('\n')[0].replace(/^expected phase "[^"]*", got "[^"]*": /, '')
    return `<li><b>${esc(entry.title)}</b>${entry.version ? ` ${esc(entry.version)}` : ''} ${what} on ${esc(runtimes.join(', '))}, so it has no label there.${why ? ` <span class="soft">${esc(why)}</span>` : ''}</li>`
  }).join('\n')
}

// Marks a figure that comes from a tuned variant rather than the package as installed.
const WRENCH = '<svg class="ico" viewBox="0 0 24 24" role="img" aria-label="Tuned"><path fill="currentColor" d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>'

// The class of a package on one runtime: its best variant in each task. With
// one task that is a figure and a class; across several, the mean class.
function packageGrade(pkg, runtimeId, rankingId) {
  const perTask = new Map()
  const tuned = new Map()
  for (const a of pkg.appearances) {
    const grade = a.entry.grades[rankingId]
    if (a.runtime.id !== runtimeId || !grade) continue
    const held = perTask.get(a.data)
    // The package as installed is the headline; a tuned variant only stands in
    // when there is no default entry on this runtime.
    const isDefault = a.entry.name === a.entry.package
    if (!held || (isDefault && !held.isDefault) || (isDefault === held.isDefault && grade.value < held.entry.grades[rankingId].value)) perTask.set(a.data, { ...a, isDefault })
    const best = tuned.get(a.data)
    if (!isDefault && (!best || grade.value < best.entry.grades[rankingId].value)) tuned.set(a.data, a)
  }
  const hits = [...perTask.values()]
  if (hits.length === 0) return null
  if (hits.length === 1) {
    const [{ data, entry, isDefault }] = hits
    const text = (e) => `${formatNumber(e.grades[rankingId].value)} ${metricFor(data, e, rankingId).unit}`
    const variant = isDefault ? tuned.get(data)?.entry : null
    return { grade: entry.grades[rankingId], text: text(entry), pairs: [{ data, entry }], tuned: variant && variant.grades[rankingId].value < entry.grades[rankingId].value ? { grade: variant.grades[rankingId], text: text(variant), title: variant.title, pairs: [{ data, entry: variant }] } : null }
  }
  // Reference entries have no class to average: the row keeps its mean multiple.
  if (hits.every((a) => a.entry.grades[rankingId].reference)) return { grade: { class: null, reference: true, value: 0, ratio: Math.round(hits.reduce((sum, a) => sum + a.entry.grades[rankingId].ratio, 0) / hits.length * 100) / 100 }, text: `${times(hits.reduce((sum, a) => sum + a.entry.grades[rankingId].ratio, 0) / hits.length)} over ${hits.length} tasks`, several: true, pairs: hits.map((a) => ({ data: a.data, entry: a.entry })) }
  // Across several tasks the figure is the geometric mean of the entry's
  // multiples of each task's best, and its class is that multiple on the
  // tasks' scale.
  const ratio = Math.exp(hits.reduce((sum, a) => sum + Math.log(Math.max(a.entry.grades[rankingId].ratio, 0.01)), 0) / hits.length)
  const scale = hits[0].data.metrics?.[rankingId]?.scale
  const at = scale ? scale.findIndex((limit) => ratio <= limit) : -1
  const mean = scale ? (at === -1 ? CLASSES.length - 1 : at) : Math.round(hits.reduce((sum, a) => sum + CLASSES.indexOf(a.entry.grades[rankingId].class), 0) / hits.length)
  return { grade: { class: CLASSES[mean], value: Math.round(ratio * 100) / 100, ratio: Math.round(ratio * 100) / 100 }, text: `${times(ratio)} over ${hits.length} tasks`, several: true, pairs: hits.map((a) => ({ data: a.data, entry: a.entry })) }
}

// One row per package, for one runtime at a time. Mixing runtimes in one
// table leaves most cells empty as languages are added.
// `everyPackage` marks the table for the page script to add the packages
// that have no results, so the list is of every known package.
// `references` keeps reference entries (and their switch): only a category's
// own table has them. Elsewhere those results are left out, and a package
// with nothing else is not listed.
function packageTable(packages, model, { showEcosystem, everyPackage = false, references = false }) {
  packages = activeReleaseRows(packages)
  if (!references) packages = packages.map((p) => (p.appearances.some((a) => a.entry.reference) ? { ...p, appearances: p.appearances.filter((a) => !a.entry.reference) } : p)).filter((p) => p.appearances.length)
  const actualRuntimes = model.runtimes.filter((rt) => packages.some((p) => p.appearances.some((a) => a.runtime.id === rt.id)))
  const runtimes = runtimeViews(actualRuntimes)
  if (runtimes.length === 0) return ''
  // The table opens on its widest view: every language and every runtime
  // where there are several, which is the first of the views.
  const checked = runtimes[0].id

  const panels = runtimes.map((rt) => {
    const rows = packages.filter((p) => p.appearances.some((a) => rt.best ? (rt.language === 'all' || languageOf(a.runtime.id) === rt.language) : a.runtime.id === rt.id))
    const isRust = rt.id === 'rust'
    const nativeLanguage = ['python','ruby','go'].includes(languageOf(rt.id)) ? languageOf(rt.id) : null
    const compilers = languageOf(rt.id) === 'javascript' ? Object.keys(model.index.compilers) : []
    // The runtime each row shows: this tab's, or for a "Best" tab the one the
    // package does best on.
    // An "All" tab has a row for every runtime the package was measured on.
    const pairs = rows.flatMap((pkg) => {
      const candidates = rt.best ? actualRuntimes.filter(r => (rt.language === 'all' || languageOf(r.id) === rt.language) && packageGrade(pkg,r.id,'cpu')) : [rt]
      const coverage = r => new Set(pkg.appearances.filter(a => a.runtime.id === r.id).map(a => a.data.task.id)).size
      const ordered = candidates.sort((a,b) => coverage(b)-coverage(a) || CLASSES.indexOf(packageGrade(pkg,a.id,'cpu').grade.class)-CLASSES.indexOf(packageGrade(pkg,b.id,'cpu').grade.class) || packageGrade(pkg,a.id,'cpu').grade.ratio-packageGrade(pkg,b.id,'cpu').grade.ratio)
      return (rt.every ? ordered : ordered.slice(0, 1)).map((selected) => ({ pkg, selected }))
    })
    // Places are held among the rows of this table, once for each setting of
    // the Settings switch, since tuned figures change who is first and last.
    const scopeOf = (rankingId, view) => pairs.flatMap((row) => {
      const hit = packageGrade(row.pkg, row.selected.id, rankingId)
      return hit ? (view === 'tuned' && hit.tuned ? hit.tuned.pairs : hit.pairs).map((pair) => ({ ...pair, row })) : []
    })
    const markers = Object.fromEntries(['cpu', 'memory'].map((id) => [id, { installed: marker(scopeOf(id, 'installed')), tuned: marker(scopeOf(id, 'tuned')) }]))
    const typedOf = (row) => row.pkg.appearances.filter((a) => a.runtime.id === row.selected.id).find((a) => a.entry.types)
    const typeMarker = marker(pairs.flatMap((row) => (typedOf(row) ? [{ data: typedOf(row).data, entry: typedOf(row).entry, row }] : [])))
    const metricCell = (pkg, rankingId, selectedId) => {
      const hit = packageGrade(pkg, selectedId, rankingId)
      if (!hit) return cell(null, NA)
      // A count of tasks stands in for a figure, so it is set apart in italics.
      const asInstalled = `${hit.several ? `<i>${esc(hit.text)}</i>` : esc(hit.text)}${chip(rankingId, hit.grade)}`
      if (!hit.tuned) return gradedCell(hit.grade, asInstalled)
      // Both figures are in the cell; the Settings switch shows one of them,
      // and the script swaps which one the column sorts by.
      const tuned = hit.tuned.grade
      return `<td data-grade="${CLASSES.indexOf(hit.grade.class)}" data-v="${hit.grade.ratio ?? ''}" data-value="${hit.grade.value ?? ''}" data-tuned-grade="${CLASSES.indexOf(tuned.class)}" data-tuned-v="${tuned.ratio ?? ''}" data-tuned-value="${tuned.value ?? ''}"><span class="as-installed">${asInstalled}</span><span class="as-tuned" title="${esc(hit.tuned.title)}">${WRENCH}${esc(hit.tuned.text)}${chip(rankingId, tuned)}</span></td>`
    }
    const body = pairs.map(({ pkg, selected }) => {
      const here = pkg.appearances.filter((a) => a.runtime.id === selected.id)
      const typedAt = here.find((a) => a.entry.types)
      const typed = typedAt?.entry
      // Every mark the row holds, after its name. A row's place can differ
      // between the two settings, so both sets are there and the switch shows one.
      const typeKeys = isRust || rt.language === 'all' || nativeLanguage ? ['types'] : compilers
      const marksFor = (view) => [
        ...['cpu', 'memory'].map((id) => {
          const hit = packageGrade(pkg, selected.id, id)
          return hit ? markers[id][view]((view === 'tuned' && hit.tuned ? hit.tuned.pairs : hit.pairs), id) : ''
        }),
        ...typeKeys.map((key) => (typedAt ? typeMarker([typedAt], key) : '')),
      ]
      const [installedMarks, tunedMarks] = [medalBadges(marksFor('installed')), medalBadges(marksFor('tuned'))]
      const marks = installedMarks === tunedMarks ? installedMarks : `<span class="as-installed">${installedMarks}</span><span class="as-tuned">${tunedMarks}</span>`
      const typeCells = isRust
        ? typeCost(typed?.types, typed?.grades.types) + cell(typed?.types?.coldCpuS, num(typed?.types?.coldCpuS, ' s'))
        : rt.language === 'all' ? typeCost(typed?.types?.compilers?.[model.tasks[0].typesCompiler] ?? typed?.types, typed?.grades.types) : nativeLanguage ? typeCost(typed?.types, typed?.grades.types) : compilers.map((id) => typeCost(typed?.types.compilers[id])).join('')
      return `<tr${everyPackage ? ' data-status="Measured"' : ''}${here.length && here.every((a) => a.entry.reference) ? ' data-reference' : ''}><td><a href="${urls.package(pkg,pkg.version===pkg.defaultVersion?null:pkg.version)}">${esc(pkg.title)}</a><span class="ver">${esc(pkg.version ?? '')}</span>${marks}</td>
${metricCell(pkg, 'cpu', selected.id)}${metricCell(pkg, 'memory', selected.id)}${typeCells}
<td>${new Set(here.map((a) => a.data)).size}</td>
${pkg.listed ? `<td data-v="${pkg.listed.share}" title="Number ${pkg.listed.rank} on ${esc(ECOSYSTEMS[pkg.ecosystem].title)}, ${esc(pkg.listed.popularity.label)}">${compact(pkg.listed.popularity.value)}</td>` : cell(null, NA)}
${everyPackage ? (pkg.listed ? `<td data-v="${pkg.listed.rank}" title="In ${esc(ECOSYSTEMS[pkg.ecosystem].title)}, by ${esc(pkg.listed.popularity.label)}">${pkg.listed.rank}</td>` : cell(null, NA)) : ''}
${rt.best ? `<td class="l">${inlineIcon(selected.id)}${esc(selected.title)}</td>` : ''}${rt.language === 'all' ? `<td class="l">${esc(languageTitle(languageOf(selected.id)))}</td>` : ''}
<td class="l categories">${[...new Set(here.map(a => a.data.task.category))].map(id => `<a href="${urls.category(id)}">${esc(model.categories.find(c => c.id === id).title)}</a>`).join(', ')}</td>
${everyPackage ? '<td class="l" data-v="0">Measured</td>' : ''}${showEcosystem ? `<td class="l">${inlineIcon(`eco-${pkg.ecosystem}`)}<a href="${urls.ecosystem(pkg.ecosystem)}">${esc(ECOSYSTEMS[pkg.ecosystem].title)}</a></td>` : ''}</tr>`
    })
    const typeHeads = isRust ? sortableTypes('cargo check') + sortable('cargo check, first run, CPU') : rt.language === 'all' ? sortableTypes('Type check') : nativeLanguage ? sortableTypes(`Type check, ${({python: 'mypy', ruby: 'Sorbet', go: 'go/types'})[nativeLanguage]}`) : compilers.map((id) => sortableTypes(`Type check, ${id} ${esc(model.index.compilers[id])}`)).join('')
    return `<section class="panel" data-runtime="${rt.id}"${runtimes.length === 1 ? ' style="display:block"' : ''} aria-label="Packages on ${esc(rt.title)}">
<div class="scroll"><table class="sortable" data-md="measured"${everyPackage ? ' data-filters="status"' : ''}>
<caption>${rt.every ? `${plural(pairs.length, 'result')}: every release on every runtime it was measured on. ` : `${plural(rows.length, 'release')} on ${esc(rt.title)} ${esc(rt.version)}. `}${rt.best && !rt.every ? 'Best is the runtime with the lowest CPU class and cost for the package. Only the runtimes that cover the most tasks are compared. All figures in a row come from that runtime. ' : ''}Columns with a class sort by class first, then by figure. Press a heading again for the next order. A medal after the name of a package shows that one of its figures is in the top three for its task, among the packages listed here: gold for the best, silver for the runner-up, bronze for third. Equal figures share a place, and ×2 or more means several medals. Hover over a medal to see what it is for. Use is the download count of the package in its registry. Hover over it for the measure and the rank. It sorts by share of the registry, so that registries can be compared.</caption>
<thead><tr><th scope="col">Package</th>${sortableGraded('CPU')}${sortableGraded('Memory')}${typeHeads}${sortable('Tasks')}${sortable('Use')}${everyPackage ? sortable('Rank') : ''}${rt.best ? sortable('Runtime', ' class="l"') : ''}${rt.language === 'all' ? sortable('Language', ' class="l"') : ''}${sortable('Categories', ' class="l"')}${everyPackage ? sortable('Status', ' class="l"') : ''}${showEcosystem ? '<th scope="col" class="l">Ecosystem</th>' : ''}</tr></thead>
<tbody>${body.join('\n')}</tbody></table></div>
${TYPE_KEY}
</section>`
  })
  const hasTuned = packages.some((p) => p.appearances.some((a) => a.entry.name !== a.entry.package))
  if (runtimes.length === 1 && !hasTuned) return panels[0]
  const rules = runtimes.map((rt) => `.pick:has(#runtime-${rt.id}:checked) .panel[data-runtime="${rt.id}"]`)
  const settings = hasTuned
    ? switcher('settings', 'Settings', [{ id: 'tuned', title: 'Tuned', icon: WRENCH.replace('role="img" aria-label="Tuned"', 'aria-hidden="true"') }, { id: 'installed', title: 'As installed' }], 'tuned')
    : ''
  return `<div class="pick"${everyPackage ? ' data-catalog' : ''}>
<style>${rules.join(',')}{display:block}</style>
<div class="switches">${settings}${runtimes.length > 1 ? switcher('runtime', 'Runtime', runtimes.map((rt) => ({ id: rt.id, title: rt.title, detail: rt.version })), checked) : ''}${packages.some((p) => p.appearances.some((a) => a.entry.reference)) ? switcher('reference-packages', 'Reference items', [{ id: 'shown', title: 'Show' }, { id: 'hidden', title: 'Hide' }], 'shown') : ''}</div>
${panels.join('\n')}
</div>`
}

// Under the package table that lists every package: what Use and Rank mean.
const EVERY_PACKAGE_NOTE = `<p class="soft">Use and Rank are the figure and the position of the package in its own registry. Use is downloads per month for npm and PyPI, total downloads for crates.io and RubyGems, downloads in the last 90 days for JSR, and dependent repositories for Go modules. The script on this page adds the packages that have no results.</p>`

export function packagesPage(model) {
  return layout({
    title: 'Packages: Package Efficiency Labels',
    description: 'Every measured package, with its classes on each runtime.',
    path: '/packages/',
    formats: { data: true },
    crumbs: [['Packages']],
    model,
    body: `<main>
<h1>Packages</h1>
<p class="intro">${allKnownPackages(model).length.toLocaleString('en-US')} packages are listed on this site, and ${model.packages.length} are measured. The measured packages come first, with their classes and figures. The others follow, most used first. Select a language or runtime, filter by status, or sort by a column.</p>
${EVERY_PACKAGE_NOTE}
${packageTable(model.packages, model, { showEcosystem: true, everyPackage: true })}
<h2>By registry</h2>
<div class="scroll"><table class="narrow sortable">
<thead><tr><th scope="col">Ecosystem</th>${['Listed', 'Measured', 'Can be measured', 'No comparable task'].map((t) => sortable(t)).join('')}</tr></thead>
<tbody>${Object.entries(model.catalog.byEcosystem)
      .map(([id, items]) => {
        const count = (status) => items.filter((item) => statusOf(item) === status).length
        return `<tr><td>${inlineIcon(`eco-${id}`)}<a href="${urls.ecosystem(id)}">${esc(ECOSYSTEMS[id].title)}</a></td>${[items.length, count('Measured'), count('Not measured yet'), count('No comparable task')].map((n) => cell(n, n.toLocaleString('en-US'))).join('')}</tr>`
      })
      .join('\n')}</tbody>
</table></div>
</main>`,
  })
}

export function ecosystemPage(id, model) {
  const eco = ECOSYSTEMS[id]
  const packages = model.packages.filter((p) => p.ecosystem === id)
  const listed = model.catalog.byEcosystem[id] ?? []
  const intro = {
    npm: 'Packages from the npm registry, measured on each JavaScript runtime that runs them.',
    cargo: 'Rust crates. They run the same tasks as packages in other languages, so the best crate often sets class A.',
    jsr: 'Packages from the JSR registry, measured on each runtime that runs them. A package installed through the npm bridge of JSR is the same entry, not a second one.',
    builtin: 'The functions that each runtime includes. They show the cost when you use no package.',
    pypi: 'Python packages from PyPI, measured on CPython and PyPy.',
    rubygems: 'Ruby gems, measured on CRuby with and without YJIT.',
    gomod: 'Go modules, measured as compiled Go programs.',
  }[id]
  return layout({
    title: `${eco.title}: Package Efficiency Labels`,
    description: intro,
    path: urls.ecosystem(id),
    formats: { data: listed.length + packages.length > 0 },
    crumbs: [['Packages', '/packages/'], [eco.title]],
    model,
    body: `<main>
<h1>${esc(eco.title)}</h1>
<p class="intro">${esc(intro)}</p>
${packages.length ? `${listed.length ? '<h2>Measured</h2>' : ''}${packageTable(packages, model, { showEcosystem: false })}` : '<p class="note">No package in this registry is measured yet.</p>'}
${listed.length ? `<h2>Most used packages</h2>
<p>The ${listed.filter((item) => !item.picked).length.toLocaleString('en-US')} most used ${esc(eco.title)} packages, ranked by ${esc(listed[0].popularity.label)}${listed.some((item) => item.picked) ? `, and ${plural(listed.filter((item) => item.picked).length, 'package')} added by hand` : ''}: ${listed.filter((item) => item.measured).length} measured, ${listed.filter((item) => !item.measured && item.category?.benchmarkable).length} in a category that can be measured.</p>
${catalogTable(listed, model, { caption: `Use: ${esc(listed[0].popularity.label)}${model.catalog.updated?.[id] ? `, as of ${model.catalog.updated[id].updatedAt}` : ''}.` })}` : ''}
</main>`,
  })
}

function taskRows(tasks) {
  return `<div class="scroll"><table class="sortable">
<thead><tr><th scope="col">Task</th><th scope="col" class="l">What it does</th><th scope="col">Entries</th><th scope="col" class="l">Runs on</th></tr></thead>
<tbody>${tasks
    .map((data) => {
      const entries = new Set(data.runtimes.flatMap((r) => r.entries.map((e) => e.id)))
      return `<tr><td><a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a></td><td class="l wrap">${esc(data.task.summary)}</td><td>${entries.size}</td><td class="l">${data.runtimes.map((r) => esc(r.title)).join(', ')}</td></tr>`
    })
    .join('\n')}</tbody></table></div>`
}

export function tasksPage(model) {
  return layout({
    title: 'Tasks: Package Efficiency Labels',
    description: 'Every benchmark task, grouped by category.',
    path: '/tasks/',
    formats: { data: true },
    crumbs: [['Tasks']],
    model,
    body: `<main>
<h1>Tasks</h1>
<p class="intro">A task is one job that every package in a category can do. All of them run it the same way.</p>
${model.categories.map((c) => `<h2><a href="${urls.category(c.id)}">${esc(c.title)}</a></h2>${taskRows(c.tasks)}`).join('\n')}
</main>`,
  })
}

const CUT_ENDS = 5
// The labels of a task's packages, each on its best runtime, in rank order:
// the same row that opens the task's own page.
// Size on disk and import time are the package's own, not a task's: they are
// taken from one of its entries (the largest import time, where they differ).
const overallSize = (pairs) => {
  const sized = pairs.map((pair) => pair.entry.metrics).filter((m) => m.installBytes != null)[0]
  const imports = pairs.map((pair) => pair.entry.metrics.importMs).filter((ms) => ms != null)
  return { importMs: imports.length ? Math.max(...imports) : null, ...(sized ? { installBytes: sized.installBytes, installKind: sized.installKind } : {}) }
}
// One label for each package over every task of a category: its geometric
// mean multiple of each task's best, on the runtime it covers most tasks and
// does best on. Reference entries are left out.
function overallLabels(category, packages, model) {
  const rankings = Object.keys(RANKINGS)
  const runtimes = model.runtimes.filter((rt) => packages.some((p) => p.appearances.some((a) => a.runtime.id === rt.id)))
  const rows = packages.flatMap((pkg) => {
    const best = runtimes
      .map((rt) => ({ rt, cpu: packageGrade(pkg, rt.id, 'cpu'), memory: packageGrade(pkg, rt.id, 'memory') }))
      .filter((r) => r.cpu?.several && r.cpu.grade.class)
      .sort((a, b) => b.cpu.pairs.length - a.cpu.pairs.length || a.cpu.grade.ratio - b.cpu.grade.ratio)[0]
    // The type-check cost is the package's own, the same in every task.
    const typed = best && pkg.appearances.find((a) => a.runtime.id === best.rt.id && a.data.task.category === category.id && a.entry.grades.types && !a.entry.builtin)
    return best ? [{ pkg, ...best, types: typed ? { grade: typed.entry.grades.types, at: typed } : null }] : []
  })
  if (rows.length < 2) return ''
  const name = `rank-overall-${category.id.replace(/[^a-z0-9]+/gi, '-')}`
  const data = { metrics: { cpu: { unit: '×', headline: 'times the best CPU result' }, memory: { unit: '×', headline: 'times the best memory result' } }, typeChecks: {} }
  return `<h3>Overall</h3>
<div class="ranked">
<style>${rankings.map((id) => `.ranked:has(#${name}-${id}:checked) .ranked-panel[data-ranking="${id}"]`).join(',')}{display:block}</style>
<div class="switches">${switcher(name, 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}${orderSwitch(`order-${name}`)}</div>
${rankings.map((id) => {
    const cards = rows.filter((row) => row[id]).sort((a, b) => (a[id].grade.ratio ?? a[id].grade.value) - (b[id].grade.ratio ?? b[id].grade.value)).map(({ pkg, rt, cpu, memory, types }) => {
      if (id === 'types') {
        const svg = renderLabel({ entry: types.at.entry, data: types.at.data, runtime: rt, rankingId: 'types' })
        return svg ? `<li data-label><p class="over"></p>${svg}<p class="under"><a href="${urls.package(pkg)}">${esc(pkg.title)}, all tasks</a></p></li>` : ''
      }
      const tasks = cpu.pairs.length
      const svg = renderLabel({
        entry: { title: pkg.title, grades: { cpu: cpu.grade, memory: memory.grade }, metrics: overallSize(cpu.pairs), adapter: { notes: `The figure is the geometric mean, over ${plural(tasks, 'task')}, of this package's multiple of the best result in each task.` }, flags: [] },
        data, runtime: rt, rankingId: id, subtitle: pkg.version ? `Version ${pkg.version}` : '', context: `Overall, ${rt.title}, across ${plural(tasks, 'task')}`, address: urls.category(category.id),
      })
      return svg ? `<li data-label><p class="over"></p>${svg}<p class="under"><a href="${urls.package(pkg)}">${esc(pkg.title)}, all tasks</a></p></li>` : ''
    })
    return `<div class="ranked-panel" data-ranking="${id}">${shelf(cards)}</div>`
  }).join('\n')}
</div>`
}

// `all` is for the task's own page: every package, none cut, with the note
// that says which result sets class A.
function taskLabels(data, model, { all = false } = {}) {
  const rankings = Object.keys(RANKINGS)
  const name = `rank-${data.task.id.replace(/[^a-z0-9]+/gi, '-')}`
  return `<div class="ranked">
<style>${rankings.map((id) => `.ranked:has(#${name}-${id}:checked) .ranked-panel[data-ranking="${id}"]`).join(',')}{display:block}</style>
<div class="switches">${switcher(name, 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}${orderSwitch(`order-${name}`)}</div>
${rankings.map((id) => {
    // Reference entries are left out of this row.
    const cards = bestTaskEntries(data.runtimes, 'all', id).filter((entry) => !entry.reference).map((entry) => card({ entry, data, runtime: entry.selectedRuntime, rankingId: id, model, caption: entry.selectedRuntime.title })).filter(Boolean)
    // A long row is cut in the middle: the five at each end, and between them
    // a torn strip that says how many are left out and leads to all of them.
    const cut = all ? 0 : cards.length - 2 * CUT_ENDS
    const shown = cut < 2 ? cards : [...cards.slice(0, CUT_ENDS), `<li class="shelf-cut"><a href="${urls.task(data.task.id)}"><b>${cut}</b><span>more ${cut === 1 ? 'package' : 'packages'}</span><u>See all</u></a></li>`, ...cards.slice(-CUT_ENDS)]
    const ranked = all ? bestTaskEntries(data.runtimes, 'all', id).filter((entry) => !entry.reference) : []
    return `<div class="ranked-panel" data-ranking="${id}">${ranked.length ? anchorNote(data, { best: true }, id, ranked) : ''}${shelf(shown, { limit: cut < 2 ? SHELF_LIMIT : 0 })}</div>`
  }).join('\n')}
</div>`
}

export function categoryPage(category, model) {
  const packages = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === category.id))
  return layout({
    title: `${category.title}: Package Efficiency Labels`,
    description: category.summary,
    path: urls.category(category.id),
    formats: { data: true },
    context: { category: category.id },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.taxonomy, model), [category.title]],
    model,
    body: `<main>
<h1>${categoryIcon(category.id, 48)}${esc(category.title)}</h1>
<p class="intro">${esc(category.summary)}</p>
<h2>Tasks</h2>
${taskRows(category.tasks)}
<h2>Packages</h2>
<p class="soft">Each package on its best runtime. <a href="${urls.task(category.tasks[0].task.id)}">${category.tasks.length > 1 ? 'Each task page' : 'The task page'}</a> has every runtime.</p>
${category.tasks.length > 1 ? overallLabels(category, packages, model) : ''}
${category.tasks.map((d) => `${category.tasks.length > 1 ? `<h3><a href="${urls.task(d.task.id)}">${esc(d.task.title)}</a></h3>\n` : ''}${taskLabels(d, model)}`).join('\n')}
${packageTable(packages, model, { showEcosystem: true, references: true })}
<h2 id="runtimes">Languages and runtimes compared</h2>
${runtimeSection(category.tasks, model, category.title)}
${(() => {
  const others = (model.catalog.byCategory.get(category.taxonomy) ?? []).filter((item) => !item.measured)
  return others.length ? `<h2>Not measured yet in this category</h2>\n${catalogTable(others, model, { showEcosystem: true, caption: `${plural(others.length, 'listed package')} that could run these tasks but have no adapter yet. ${USE_NOTE}` })}` : ''
})()}
</main>`,
  })
}

// A small picture of a class scale, used on category tiles.
// Each category is pictured as a piece of hardware, drawn like a catalog part
// (site/assets/categories/<id>.svg). A category without a drawing gets a
// plain hex nut. The drawings are placed inline and coloured by the page's
// stylesheet (`.cat` rules), not by the media query inside each file: Safari
// does not reliably apply a colour-scheme query inside an SVG used as an image.
const CATEGORY_ART = Object.fromEntries(
  readdirSync(new URL('./assets/categories/', import.meta.url))
    .filter((file) => file.endsWith('.svg'))
    .map((file) => {
      const source = readFileSync(new URL(`./assets/categories/${file}`, import.meta.url), 'utf8')
      const inner = source.replace(/^[^]*?<\/style>/, '').replace(/<\/svg>\s*$/, '').trim()
      return [file.slice(0, -4), inner]
    }),
)
// The drawings as files in their light colours, for the search results, whose
// list is white in both colour schemes.
export const categoryIconFiles = () =>
  Object.fromEntries(readdirSync(new URL('./assets/categories/', import.meta.url)).filter((file) => file.endsWith('.svg'))
    .map((file) => [file, readFileSync(new URL(`./assets/categories/${file}`, import.meta.url), 'utf8').replace(/@media \(prefers-color-scheme:dark\)\{(?:[^{}]*\{[^{}]*\})*\}/, '')]))
const categoryMark = (id) => `cat/${CATEGORY_ART[id] ? id : '_default'}`
// Sizes are whole fractions of the 96-unit drawing grid (48 is half, 24 a
// quarter), so lines land on whole pixels.
const categoryIcon = (id, size = 48) =>
  `<svg class="cat" viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true">${CATEGORY_ART[id] ?? CATEGORY_ART._default}</svg>`

// Every category as a tile, measured or not, under its group.
function categoryTile(c, model) {
  const measured = model.categories.find((m) => m.taxonomy === c.id)
  const listed = model.catalog.byCategory.get(c.id)?.length ?? 0
  if (measured) {
    const packages = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === measured.id))
    return `<li><a href="${urls.category(measured.id)}">${categoryIcon(measured.id)}<span><b>${esc(measured.title)}</b><small>${plural(measured.tasks.length, 'task')}, ${plural(packages.length, 'package')} measured</small></span></a></li>`
  }
  return `<li class="pending"><a href="/${c.id}/">${categoryIcon(c.id)}<span><b>${esc(c.title)}</b><small>${plural(listed, 'package')}${c.benchmarkable ? ', not measured yet' : ''}</small></span></a></li>`
}
function categoryTiles(model, categories = model.catalog.categories.filter((c) => model.categories.some((m) => m.taxonomy === c.id))) {
  return `<ul class="tiles">${categories.map((c) => categoryTile(c, model)).join('')}</ul>`
}
// Categories under their groups. `measuredOnly` leaves out the categories
// (and the groups) with nothing measured; those headings carry no id, since
// the full list on the same page has them.
function groupedTiles(model, heading = 'h2', { measuredOnly = false } = {}) {
  const measured = (c) => model.categories.some((m) => m.taxonomy === c.id)
  return model.catalog.groups
    .map((group) => {
      const members = model.catalog.categories.filter((c) => c.group === group.id && (!measuredOnly || measured(c))).sort((a, b) => measured(b) - measured(a) || categoryShare(model, b.id) - categoryShare(model, a.id) || a.title.localeCompare(b.title))
      if (members.length === 0) return ''
      return `<${heading}${measuredOnly ? '' : ` id="${group.id}"`}><a href="${urls.group(group.id)}">${groupIcon(group.id)}${esc(group.title)}</a> <span class="count">${members.length}</span></${heading}>\n${categoryTiles(model, members)}`
    })
    .filter(Boolean)
    .join('\n')
}

// Every task in one table: the measured ones, then the candidate task of each
// category that has not been measured yet.
function allTasksTable(model, groupId) {
  const groupTitle = (taxonomyId) => model.catalog.groups.find((g) => g.id === model.catalog.categories.find((c) => c.id === taxonomyId)?.group)?.title ?? ''
  const inGroup = (taxonomyId) => !groupId || model.catalog.categories.find((c) => c.id === taxonomyId)?.group === groupId
  const measured = model.categories.filter((c) => inGroup(c.taxonomy)).flatMap((c) =>
    c.tasks.map((d) => {
      const packages = new Set(d.runtimes.flatMap((r) => r.entries.map((e) => `${e.ecosystem}/${e.package}`))).size
      return `<tr data-status="Measured" data-group="${esc(groupTitle(c.taxonomy))}"><td>${categoryIcon(c.id, 24)}<a href="${urls.task(d.task.id)}">${esc(d.task.title)}</a></td><td class="l"><a href="${urls.category(c.id)}">${esc(c.title)}</a></td><td class="l">${esc(groupTitle(c.taxonomy))}</td><td class="l" data-v="0">Measured</td>${cell(packages, packages)}${cell(categoryShare(model, c.taxonomy), sharePct(categoryShare(model, c.taxonomy)))}<td class="l wrap">${esc(d.task.summary)}</td></tr>`
    }),
  )
  const planned = model.index.planned.filter((c) => inGroup(c.id)).sort((a, b) => categoryShare(model, b.id) - categoryShare(model, a.id)).map((c) => `<tr id="${esc(c.id)}" data-status="Not measured yet" data-group="${esc(groupTitle(c.id))}"><td class="soft">${categoryIcon(c.id, 24)}Candidate</td><td class="l"><a href="/${esc(c.id)}/">${esc(c.title)}</a></td><td class="l">${esc(groupTitle(c.id))}</td><td class="l soft" data-v="1">Not measured yet</td>${cell(c.packages, c.packages)}${cell(categoryShare(model, c.id), sharePct(categoryShare(model, c.id)))}<td class="l wrap">${esc(c.benchmarkIdea ?? '')}</td></tr>`)
  if (measured.length + planned.length === 0) return ''
  return `<div class="scroll"><table class="sortable" id="planned" data-md="tasks" data-filters="status">
<caption>${notes([
    'Packages: for a measured task, the packages measured in it. For a candidate, the packages of the category that are among the most used on npm, crates.io, PyPI, RubyGems, Go modules and JSR.',
    'Share of use: the part of the listed downloads of each registry (dependents for Go modules) that goes to the packages of the category. It is the mean of the six registries. Candidates are sorted by it, largest first.',
  ])}</caption>
<thead><tr><th scope="col">Task</th>${sortable('Category', ' class="l"')}${sortable('Group', ' class="l"')}${sortable('Status', ' class="l"')}${sortable('Packages')}${sortable('Share of use')}<th scope="col" class="l">What the task does</th></tr></thead>
<tbody>${[...measured, ...planned].join('\n')}</tbody>
</table></div>`
}

// The breadcrumb step for the group a category (by its taxonomy id) is in.
const groupCrumb = (taxonomyId, model) => {
  const group = model.catalog.groups?.find((g) => g.id === model.catalog.categories.find((c) => c.id === taxonomyId)?.group)
  return group ? [[group.title, urls.group(group.id)]] : []
}

// One group of categories: its categories as tiles, then their tasks.
export function groupPage(group, model) {
  const members = model.catalog.categories.filter((c) => c.group === group.id)
  const measured = members.filter((c) => model.categories.some((m) => m.taxonomy === c.id))
  const packages = members.reduce((sum, c) => sum + (model.catalog.byCategory.get(c.id)?.length ?? 0), 0)
  const tasks = allTasksTable(model, group.id)
  const ordered = [...members].sort((a, b) => measured.includes(b) - measured.includes(a) || categoryShare(model, b.id) - categoryShare(model, a.id) || a.title.localeCompare(b.title))
  return layout({
    title: `${group.title}: Package Efficiency Labels`,
    description: `The ${group.title} categories: ${members.map((c) => c.title).slice(0, 6).join(', ')}${members.length > 6 ? ' and more' : ''}.`,
    path: urls.group(group.id),
    formats: { data: true },
    context: { group: group.id },
    crumbs: [['Categories', '/categories/'], [group.title]],
    model,
    body: `<main>
<h1>${groupIcon(group.id)}${esc(group.title)}</h1>
<p class="intro">${group.id === 'not-comparable' ? 'Groups of packages that have no one job that all their members can run the same way. They are listed, but not compared.' : `${plural(members.length, 'sub-category')}. ${measured.length} are measured, with ${packages.toLocaleString('en-US')} of the listed packages.`}</p>
<h2>Sub-categories</h2>
${categoryTiles(model, ordered)}
${tasks ? `<h2>Tasks</h2>\n${tasks}` : ''}
</main>`,
  })
}

export function categoriesPage(model) {
  return layout({
    title: 'Categories: Package Efficiency Labels',
    description: 'Categories of packages that do the same job, measured and planned.',
    path: '/categories/',
    formats: { data: true },
    crumbs: [['Categories']],
    model,
    body: `<main>
<h1>Categories</h1>
<p class="intro">A category is a group of packages that can do the same job. They can run the same task, so they can be compared. ${model.catalog.categories.length} categories in ${model.catalog.groups.length} groups, ${model.categories.length} are measured. The <a href="#tasks">table of all tasks</a> is below.</p>
${groupedTiles(model)}
<h2 id="tasks">All tasks</h2>
<p>${plural(model.tasks.length, 'task')} measured, and a candidate task for each of the ${plural(model.index.planned.length, 'category')} that are not measured yet.</p>
${allTasksTable(model)}
</main>`,
  })
}

// A few measured packages at the top of the home page, as examples of a
// label. The pool is the most used measured packages, taken in turn from
// each registry so that one registry does not fill it. Four show at a time,
// drawn at random with the day as the seed: the same four for everyone on a
// day, and another four the next. The page carries the whole pool; a script
// beside it draws the day's four (without it the first four show).
const FEATURED = { pool: 24, shown: 4 }
function featured(model) {
  const byRegistry = new Map()
  for (const pkg of model.packages) {
    if (pkg.ecosystem === 'builtin' || !pkg.listed || pkg.appearances.length === 0 || pkg.appearances.some((a) => a.entry.reference)) continue
    if (!byRegistry.has(pkg.ecosystem)) byRegistry.set(pkg.ecosystem, [])
    byRegistry.get(pkg.ecosystem).push(pkg)
  }
  const queues = [...byRegistry.values()].map((list) => list.filter((p) => p.listed.rank).sort((a, b) => a.listed.rank - b.listed.rank))
  const pool = []
  for (let turn = 0; pool.length < FEATURED.pool && queues.some((q) => q[turn]); turn++) for (const queue of queues) if (queue[turn] && pool.length < FEATURED.pool) pool.push(queue[turn])
  if (pool.length <= FEATURED.shown) return ''
  const cards = pool.map((pkg) => {
    const data = pkg.appearances[0].data
    // The package as installed where it has such an entry, not a tuned variant.
    const rows = pkg.appearances.filter((a) => a.data === data)
    const plain = rows.filter((a) => a.entry.name === a.entry.package)
    const best = bestResult(plain.length ? plain : rows)
    // All three measures on one label. Its other shapes come from the package's
    // own address when this is its best result, and from the result's otherwise.
    const own = !plain.length || best === bestResult(rows)
    const base = own ? urls.embed(data.task.id, pkg, '') : urls.embedResult(data.task.id, best.runtime.id, best.entry.id, null, '')
    const svg = overviewLabel({ entry: best.entry, data, runtime: best.runtime })
    if (!svg) return ''
    return `<li data-label="${esc(`${base}overview.svg`)}" data-embed="${esc(base)}" data-embed-page="${esc(own ? urls.package(pkg) : urls.result(data.task.id, best.runtime.id, best.entry))}" data-embed-alt="${esc(`Package efficiency of ${best.entry.title}`)}" data-ranking="all" data-embed-rankings="${Object.keys(RANKINGS).filter((id) => best.entry.grades[id]).join(',')}" data-label-pattern="${esc(urls.label(data.task.id, best.runtime.id, best.entry.id, '{r}', null))}"><p class="over"></p>${svg}<p class="under"><a href="${urls.package(pkg)}">${esc(pkg.title)}, all runtimes</a> &nbsp; <a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a> &nbsp; <a href="${urls.result(data.task.id, best.runtime.id, best.entry)}">Permalink</a></p></li>`
  }).filter(Boolean)
  return `<h2>Random packages</h2>
<p class="soft">Four of the most used packages, drawn every day.</p>
<ul class="shelf featured overview" data-shown="${FEATURED.shown}">${cards.join('\n')}</ul>
<script>(() => {
  const list = document.currentScript.previousElementSibling, items = [...list.children]
  // A small seeded generator (mulberry32), so a day always draws the same four.
  let seed = Math.floor(Date.now() / 864e5)
  const random = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const left = [...items], picked = new Set()
  while (picked.size < Number(list.dataset.shown) && left.length) picked.add(left.splice(Math.floor(random() * left.length), 1)[0])
  // In the order drawn, not the pool's.
  for (const item of items) item.hidden = !picked.has(item)
  list.prepend(...picked)
  list.classList.add('picked')
})()</script>`
}

export function homePage(model) {
  const lead = model.tasks[0]
  return layout({
    title: 'Package Efficiency Labels',
    description: 'Energy-label style efficiency classes for packages: CPU, memory and type-check cost, measured per task across runtimes.',
    path: '/',
    formats: { data: true },
    model,
    body: `<main>
<h1>Package Efficiency Labels</h1>
<p class="intro">Packages that do the same job run the same task. Each one gets a class from A to G for CPU, memory and type-check cost, like the label on a fridge.</p>
${featured(model)}
<h2>Measured categories</h2>
${groupedTiles(model, 'h3', { measuredOnly: true })}
<h2>Packages</h2>
<p>Every listed package. The ${model.packages.length} measured packages come first, with their classes. The others follow, most used first.</p>
${EVERY_PACKAGE_NOTE}
${packageTable(model.packages, model, { showEcosystem: true, everyPackage: true })}
<h2>Reading a label</h2>
${legend(lead)}
<p>The best result for a task, in any language or runtime, sets class A. Thus a class means the same on every page. A function built into a runtime is also an entry, so you can compare a package with no package.</p>
<h2>All categories</h2>
<p>${model.catalog.categories.length} categories in ${model.catalog.groups.length} groups, made from the most used packages on npm, crates.io, PyPI, RubyGems, Go modules and JSR. Categories with a dashed border are not measured yet; <a href="/categories/#tasks">see the candidate task for each</a>.</p>
${groupedTiles(model, 'h3')}
</main>`,
  })
}

// --- Runtimes compared ------------------------------------------------------

const geomean = (values) => Math.exp(values.reduce((sum, v) => sum + Math.log(v), 0) / values.length)

// How each runtime or language does across `tasks`, per graded metric: the
// typical entry (geometric mean of every entry's multiple of the task's best)
// and the best entry. Across several tasks the multiples are averaged the same
// way and the classes by position, since each task has its own boundaries.
// Type-check cost for a runtime: the cost scores of the packages measured on
// it, as multiples of the lowest score on any runtime in the task: the same
// comparison across checkers (TypeScript, mypy, Sorbet, Go's checker, cargo
// check) that the per-package classes use. Built-ins add nothing to a
// check, so they only count where a runtime has no packages.
// The type-check boundaries: each class's CPU boundary times its memory
// boundary (see build-data.mjs).
const TYPE_RUNTIME_SCALE = [1.5, 3, 6, 12, 25, 50].map((times, i) => times * [1.5, 2.5, 4, 6.5, 10, 16][i])
const typeScore = (e) => (e.grades.types?.value == null ? null : Math.max(e.grades.types.value, 0.001))
function typeCheckRatios(data, entries) {
  const scores = (list) => {
    const packages = list.filter((e) => !e.builtin).map(typeScore).filter((v) => v !== null)
    return packages.length ? packages : list.map(typeScore).filter((v) => v !== null)
  }
  const own = scores(entries)
  if (own.length === 0) return []
  const best = Math.min(...data.runtimes.flatMap((r) => scores(r.entries)))
  return own.map((v) => v / best)
}

export function runtimeScores(tasks, model) {
  return model.runtimes
    .map((rt) => {
      const score = { runtime: rt, entries: 0 }
      for (const rankingId of ['cpu', 'memory', 'types']) {
        const perTask = []
        for (const data of tasks) {
          // Reference entries are not what a runtime is compared by.
          const entries = (data.runtimes.find((r) => r.id === rt.id)?.entries ?? []).filter((e) => !e.reference)
          const ratios = rankingId === 'types' ? typeCheckRatios(data, entries) : entries.map((e) => rankingId === 'memory' ? e.runtimeGrades?.memory : e.grades[rankingId]).filter(Boolean).map((grade) => grade.ratio)
          if (ratios.length === 0) continue
          const scale = rankingId === 'types' ? TYPE_RUNTIME_SCALE : data.metrics[rankingId].scale
          const position = (ratio) => {
            const index = scale.findIndex((limit) => ratio <= limit)
            return index === -1 ? 6 : index
          }
          perTask.push({ typical: geomean(ratios), best: Math.min(...ratios), position, count: ratios.length })
        }
        if (perTask.length === 0) continue
        const summarize = (pick) => {
          const ratio = geomean(perTask.map(pick))
          const index = Math.round(perTask.reduce((sum, t) => sum + t.position(pick(t)), 0) / perTask.length)
          return { ratio, class: CLASSES[index], value: ratio }
        }
        score[rankingId] = { typical: summarize((t) => t.typical), best: summarize((t) => t.best) }
        if (rankingId === 'types') continue
        score.entries = Math.max(score.entries, perTask.reduce((sum, t) => sum + t.count, 0))
        score.tasks = perTask.length
      }
      return score
    })
    .filter((s) => s.cpu)
    .sort((a, b) => CLASSES.indexOf(a.cpu.best.class) - CLASSES.indexOf(b.cpu.best.class) || a.cpu.best.ratio - b.cpu.best.ratio || a.cpu.typical.ratio - b.cpu.typical.ratio)
}

// A label for a runtime: its best entry across `tasks`, on the same scale the
// packages use. That is what the runtime can do; the typical entry is dragged
// around by which packages happen to have been measured. `scope` names what the tasks have in common.
// `basis` picks what the label shows and is ranked by: each runtime's best
// entry, or its typical one. The other figure goes underneath. The first and
// last places get a tag, marked as tied when the next runtime shows the same
// number.
// A small gold medal for first place, silver for the runner-up, bronze for
// third, a grey sad face for last and a straight-mouthed one for second to last. A tie shows
// the mark twice, overlapping, since the place is shared.
const PLACE_MARKS = {
  best: (x) => `<path d="M${x + 3.500} 1h3l1.500 5h-3zM${x + 9.500} 1h3l-1.500 5h-3z" fill="#8a8a8a"/><circle cx="${x + 8}" cy="10.500" r="5" fill="#f5b301" stroke="#9a6b00" stroke-width="1"/><circle cx="${x + 8}" cy="10.500" r="2" fill="#ffd95a"/>`,
  second: (x) => `<path d="M${x + 3.500} 1h3l1.500 5h-3zM${x + 9.500} 1h3l-1.500 5h-3z" fill="#8a8a8a"/><circle cx="${x + 8}" cy="10.500" r="5" fill="#c4c9d1" stroke="#737a85" stroke-width="1"/><circle cx="${x + 8}" cy="10.500" r="2" fill="#eef0f3"/>`,
  third: (x) => `<path d="M${x + 3.500} 1h3l1.500 5h-3zM${x + 9.500} 1h3l-1.500 5h-3z" fill="#8a8a8a"/><circle cx="${x + 8}" cy="10.500" r="5" fill="#cd7f32" stroke="#7d4716" stroke-width="1"/><circle cx="${x + 8}" cy="10.500" r="2" fill="#e8ab6e"/>`,
  'second-worst': (x) => `<circle cx="${x + 8}" cy="8" r="6.300" fill="none" stroke="currentColor" stroke-width="1.300"/><circle cx="${x + 5.700}" cy="6.500" r="1" fill="currentColor"/><circle cx="${x + 10.300}" cy="6.500" r="1" fill="currentColor"/><path d="M${x + 5.400} 10.600h5.200" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round"/>`,
  worst: (x) => `<circle cx="${x + 8}" cy="8" r="6.300" fill="none" stroke="currentColor" stroke-width="1.300"/><circle cx="${x + 5.700}" cy="6.500" r="1" fill="currentColor"/><circle cx="${x + 10.300}" cy="6.500" r="1" fill="currentColor"/><path d="M${x + 5.200} 11.200q2.800-2.600 5.600 0" fill="none" stroke="currentColor" stroke-width="1.300" stroke-linecap="round"/>`,
}
// Marks beside a figure in a table: the medal for the best result in its
// task, in any language or runtime, and the sad face for the worst. Either is
// doubled when another package shows the same figure. `key` is a ranking
// (cpu, memory, types) or a TypeScript compiler id for its own column.
const gradeFor = (e, key) => e.grades[key] ?? e.types?.compilers?.[key] ?? null
const figureOf = (g) => `${g.class} ${formatNumber(g.value ?? g.score)}`
// In tables the same marks as on the tags sit together after the name in the
// first column. Hovering one says what it is for.
const PLACE_TEXT = { best: 'Best', second: 'Second best', third: 'Third best', 'second-worst': 'Second to last', worst: 'Last place' }
const MEDALS = ['best', 'second', 'third']
// Which marked place a figure holds among `groups`, the distinct figures from
// best to worst, when there are `count` entries in all. The fewer the entries,
// the fewer last places are given out. The three best figures are always
// best, runner-up and third, and that takes precedence: with three figures
// there is no last place. Below the podium:
//   4 or 5 entries   the last
//   6 or more        the last and the second to last
// Packages measured out of those listed, in the same form as the categories:
// "12 of 1,000", or the bare total when nothing (or everything) is measured.
function ecosystemCount(model, id) {
  const listed = model.catalog.byEcosystem[id]
  const total = (listed?.filter((item) => !item.picked).length ?? model.packages.filter((p) => p.ecosystem === id).length).toLocaleString('en-US')
  const measured = listed?.filter((item) => item.measured).length
  return measured ? `${measured.toLocaleString('en-US')} of ${total}` : total
}

function placeOf(groups, key, count) {
  const at = groups.indexOf(key)
  if (groups.length < 2 || count < 2 || at < 0) return null
  // The podium comes first: a figure that is second or third is that, even
  // when it is also the last one there is.
  if (at === 0) return 'best'
  if (at === 1) return 'second'
  if (at === 2) return 'third'
  const bottom = count <= 5 ? 1 : 2
  const last = groups.length - 1
  if (at === last) return 'worst'
  if (at === last - 1 && bottom >= 2) return 'second-worst'
  return null
}
// Tables show only the medals, and one medal whether or not the place is
// shared; the tooltip says when it is.
const tableMark = (kind, tied, title) => (MEDALS.includes(kind) ? `<svg class="medal" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${PLACE_MARKS[kind](0)}</svg>` : '')
// Medals shown as a tally, the way lives are counted in a game: one medal of
// each kind, with ×N after it when there are several. `titles` says what each
// was won for, in the tooltip.
const MEDAL_LABELS = { best: 'aria-label="Best ', second: 'aria-label="Second best ', third: 'aria-label="Third best ' }
// `plain` leaves out the ×, for a medal table where a bare number is enough.
const tallyMedal = (kind, count, title, plain = false) => (count ? `<span class="tally">${tableMark(kind, false, title)}${count > 1 ? `<small>${plain ? '' : '×'}${count}</small>` : ''}</span>` : '')
// The medals a row won, from its per-column marks, for the end of its name.
function medalBadges(marks) {
  const badges = MEDALS.map((kind) => {
    const won = marks.filter((mark) => mark.includes(MEDAL_LABELS[kind]))
    return tallyMedal(kind, won.length, won.map((mark) => /aria-label="([^"]*)"/.exec(mark)[1]).join('; '))
  }).join('')
  return badges ? `<span class="row-marks">${badges}</span>` : ''
}
// The place of a medal that was not won: the same outline, very faint, so
// the three positions in a medal table can be read down as columns.
const EMPTY_MEDAL = '<svg class="medal empty" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.500 1h3l1.500 5h-3zM9.500 1h3l-1.500 5h-3z" fill="currentColor"/><circle cx="8" cy="10.500" r="5" fill="currentColor"/></svg>'
// Most medals first is a descending order, so that is where this column starts.
const MEDALS_HEAD = `<th scope="col" class="l" data-first="descending"><button type="button" data-sort>Medals</button></th>`
// What a column is called in a mark's tooltip.
const COLUMN_NAMES = { cpu: 'CPU', memory: 'memory', types: 'type check' }
const columnName = (key) => COLUMN_NAMES[key] ?? `type check with ${key}`

// The places within one table. `scope` is every result the table shows, as
// { data, entry, row }; a place is held among those, task by task, so the marks
// always describe the rows on the page (all of its pages, however sorted),
// never results that are not listed. Results with the same class and the same
// multiple of the best share a place.
const placeKey = (g) => `${g.class} ${g.ratio}`
const countsFor = (entry, key) => gradeFor(entry, key)?.class && !(key !== 'cpu' && key !== 'memory' && entry.builtin)
function tablePlaces(scope, key) {
  const tasks = new Map()
  for (const item of scope) {
    // Built-ins add nothing to a type check, so they neither win nor lose it.
    if (!countsFor(item.entry, key)) continue
    tasks.set(item.data, [...(tasks.get(item.data) ?? []), item])
  }
  return new Map([...tasks].map(([data, items]) => {
    const rows = new Map()
    for (const item of items.sort((a, b) => gradeFor(a.entry, key).ratio - gradeFor(b.entry, key).ratio)) {
      const group = placeKey(gradeFor(item.entry, key))
      rows.set(group, (rows.get(group) ?? new Set()).add(item.row))
    }
    return [data, { groups: [...rows.keys()], rows, count: new Set(items.map((item) => item.row)).size }]
  }))
}
// The medals of one task's three events (CPU, memory, type check). In each,
// the entries on every runtime compete and the best three figures take gold,
// silver and bronze, shared when equal. Returns, for each entry on each
// runtime (`runtime id/entry id`), the place it took in each event.
export function eventMedals(data) {
  const scope = data.runtimes.flatMap((runtime) => runtime.entries.map((entry) => ({ data, entry, runtime, row: `${runtime.id}/${entry.id}` })))
  const won = new Map()
  for (const key of ['cpu', 'memory', 'types']) {
    const places = tablePlaces(scope, key).get(data)
    if (!places) continue
    for (const item of scope) {
      if (!countsFor(item.entry, key)) continue
      const kind = placeOf(places.groups, placeKey(gradeFor(item.entry, key)), places.count)
      if (MEDALS.includes(kind)) won.set(item.row, { ...(won.get(item.row) ?? {}), [key]: kind })
    }
  }
  return won
}
// A runtime is credited with each medal an entry won on it, as a country is
// with its athletes'. For each runtime: what its golds, silvers and bronzes
// were won for.
// A runtime's medal tally for the sidebar: gold, silver and bronze counts in
// the same order and with the same meaning as the Medals column of the
// runtime tables. Counted once for the whole site.
// The runtimes in medal-table order: most golds first, then silvers, then
// bronzes, as the Medals column sorts. Ties keep their usual order.
function byMedals(model) {
  model.medalTally ??= runtimeMedals(model.tasks)
  const score = (rt) => { const won = model.medalTally.get(rt.id); return won ? won.best.length * 1e6 + won.second.length * 1e3 + won.third.length : -1 }
  return [...model.runtimes].sort((a, b) => score(b) - score(a))
}

function sideMedals(model, runtimeId) {
  model.medalTally ??= runtimeMedals(model.tasks)
  const won = model.medalTally.get(runtimeId)
  if (!won) return ''
  const counts = [['g', 'gold', won.best.length], ['s', 'silver', won.second.length], ['b', 'bronze', won.third.length]]
  return `<span class="side-medals" title="${counts.map(([, name, n]) => `${n} ${name}`).join(', ')}: best three figures among every entry of a task, for CPU, memory and type check">${counts.map(([kind, , n]) => `<i class="${kind}${n ? '' : ' none'}">${n}</i>`).join('')}</span>`
}

export function runtimeMedals(tasks) {
  const count = new Map()
  for (const data of tasks) {
    const won = eventMedals(data)
    for (const runtime of data.runtimes) {
      for (const entry of runtime.entries) {
        for (const [key, kind] of Object.entries(won.get(`${runtime.id}/${entry.id}`) ?? {})) {
          const held = count.get(runtime.id) ?? count.set(runtime.id, { best: [], second: [], third: [] }).get(runtime.id)
          held[kind].push(`${entry.title}, ${columnName(key)}, ${data.task.title}`)
        }
      }
    }
  }
  return count
}

// The mark for one cell. `pairs` are the results behind it: one task, or
// several for a package measured in more than one, where the better place wins.
function placeMark(places, pairs, key, noun = 'packages') {
  const held = pairs
    .filter(({ data, entry }) => places.has(data) && countsFor(entry, key))
    .map(({ data, entry }) => {
      const { groups, rows, count } = places.get(data)
      const group = placeKey(gradeFor(entry, key))
      return { data, kind: placeOf(groups, group, count), tied: (rows.get(group)?.size ?? 0) > 1 }
    })
    .filter((h) => h.kind)
  for (const kind of ['best', 'second', 'third', 'second-worst', 'worst']) {
    const at = held.filter((h) => h.kind === kind)
    if (at.length === 0) continue
    const tied = at.some((h) => h.tied)
    return tableMark(kind, tied, `${PLACE_TEXT[kind]} ${columnName(key)} of the ${noun} listed${tied ? ', tied' : ''}: ${at.map((h) => h.data.task.title).join(', ')}`)
  }
  return ''
}
// One table's marks: give it the results the table shows, get back a function
// from a cell's results and a column to its mark.
function marker(scope, noun) {
  const cache = new Map()
  return (pairs, key) => placeMark(cache.get(key) ?? cache.set(key, tablePlaces(scope, key)).get(key), pairs, key, noun)
}
// Only medals are doubled for a tie; two overlapping faces are hard to read.
const placeIcon = (kind, shared) => { const tied = shared && MEDALS.includes(kind); return `<svg class="place-mark" viewBox="0 0 ${tied ? 23 : 16} 16" width="${tied ? 23 : 16}" height="16" aria-hidden="true">${tied ? PLACE_MARKS[kind](7) : ''}${PLACE_MARKS[kind](0)}</svg>` }
const BASIS = { best: { title: 'Best entry', other: 'typical' }, typical: { title: 'Typical entry', other: 'best' } }
// The scope a set of tasks stands for, as it appears in a summary's address:
// "all", a category's id, or a task's id.
function scopeKeyOf(tasks, model) {
  const categories = new Set(tasks.map((d) => d.task.category))
  if (categories.size > 1) return 'all'
  const [category] = categories
  const whole = model.categories.find((c) => c.id === category)?.tasks.length ?? 1
  return tasks.length === 1 && whole > 1 ? tasks[0].task.id : category
}

// The tag above a label for its place among the labels listed with it: `shown`
// gives the figure as it reads on the label, and items that read the same
// share a place.
function placeTags(ranked, shown) {
  const groups = [...new Set(ranked.map(shown))]
  return (item) => {
    const kind = placeOf(groups, shown(item), ranked.length)
    if (!kind) return ''
    const tied = ranked.filter((r) => shown(r) === shown(item)).length > 1
    const text = { best: tied ? 'Tied' : 'Best', second: 'Runner-up', third: 'Third', 'second-worst': 'Second to last', worst: 'Last place' }[kind]
    return `<span class="place ${kind}">${placeIcon(kind, tied)}${text}${tied && kind !== 'best' ? ', tied' : ''}</span>`
  }
}

// What a runtime's summary label is drawn from: a stand-in entry whose
// figures are its multiples of the best, and the lines that say what it
// covers. `s` is one of runtimeScores' rows.
function runtimeSummary(s, tasks, scope, basis, scopeKey) {
  const grade = (id, pick) => ({ class: s[id][pick].class, value: s[id][pick].ratio })
  const entry = {
    title: s.runtime.title,
    grades: { cpu: grade('cpu', basis), memory: grade('memory', basis), ...(s.types ? { types: grade('types', basis) } : {}) },
    types: { icon: s.runtime.id },
    typeCaption: 'times the best type-check cost',
    metrics: { importMs: null },
    adapter: { notes: `Memory is all that the process holds after the task and a garbage collection, runtime included. ${basis === 'typical' ? 'The figure is the geometric mean of every entry on this runtime.' : tasks.length > 1 ? 'The figure is the geometric mean of the best result in each task.' : ''}${tasks.length > 1 ? ` It covers ${s.tasks} of ${tasks.length} tasks. Tasks without a result are not counted.` : ''}` },
    flags: [],
  }
  const data = {
    metrics: { cpu: { unit: '×', headline: 'times the best CPU result' }, memory: { unit: '×', headline: 'times the best after-task memory' } },
    typeChecks: { typescript: { unit: '×', headline: 'times the best type-check cost' } },
  }
  return { entry, data, runtime: s.runtime, subtitle: `Version ${s.runtime.version}`, context: `${scope}, ${basis === 'typical' ? 'typical entry' : 'best'} across ${plural(s.tasks, 'task')}`, address: urls.summary(s.runtime.id, scopeKey) }
}

// Every runtime summary there is a label for: each scope, runtime and basis.
// The build writes their embeddable files from this.
export function runtimeSummaries(model) {
  return summaryScopes(model).flatMap((scope) => runtimeScores(scope.tasks, model).flatMap((s) => Object.keys(BASIS).map((basis) => ({ base: urls.embedSummary(s.runtime.id, scope.key, basis, ''), summary: runtimeSummary(s, scope.tasks, scope.title, basis, scope.key) }))))
}

function runtimeCards(tasks, model, scope, rankingId, only, basis = 'best') {
  const scopeKey = scopeKeyOf(tasks, model)
  const other = BASIS[basis].other
  const ranked = runtimeScores(tasks, model)
    .filter((s) => s[rankingId])
    .sort((a, b) => CLASSES.indexOf(a[rankingId][basis].class) - CLASSES.indexOf(b[rankingId][basis].class) || a[rankingId][basis].ratio - b[rankingId][basis].ratio || a[rankingId][other].ratio - b[rankingId][other].ratio)
  // A tie is two figures that read the same on the label.
  const shown = (s) => `${s[rankingId][basis].class} ${formatNumber(s[rankingId][basis].ratio)}`
  // Runtimes that show the same figure share a place. With only three
  // distinct figures the middle one is the runner-up; with two there is no
  // second place at either end.
  const place = placeTags(ranked, shown)
  const cards = ranked
    .filter((s) => !only || s.runtime.id === only)
    .map((s) => {
      const summary = runtimeSummary(s, tasks, scope, basis, scopeKey)
      const svg = renderLabel({ ...summary, rankingId })
      const under = s[rankingId][other]
      // The tag sits above the label it is about. Every label in the row keeps
      // the same space there, tagged or not, so the labels stay level.
      const tag = only ? '' : place(s)
      const embed = urls.embedSummary(s.runtime.id, scopeKey, basis, '')
      return `<li data-label="${esc(`${embed}label.${rankingId}.svg`)}" data-embed="${esc(embed)}" data-embed-page="${esc(summary.address)}" data-embed-alt="${esc(`Package efficiency of ${s.runtime.title}, ${summary.context}`)}" data-ranking="${rankingId}" data-embed-rankings="${Object.keys(RANKINGS).filter((id) => summary.entry.grades[id]).join(',')}" data-label-pattern="${esc(`${embed}label.{r}.svg`)}">${only ? '' : `<p class="over">${tag}</p>`}${svg}<p class="under"><a href="${urls.runtime(s.runtime.id)}">${esc(s.runtime.title)}, all tasks</a> &nbsp; <a href="${urls.summary(s.runtime.id, scopeKey)}">Permalink</a><br><span class="nowrap">${BASIS[other].title} ${formatNumber(under.ratio)}×${chip(rankingId, under)}</span></p></li>`
    })
  return shelf(cards)
}

// Runtime labels for both graded rankings, then the figures behind them.
// Runtime labels with the same controls as the package rankings: which
// ranking to show, and best or worst first. Then the figures behind them.
function runtimeSection(tasks, model, scope, highlight) {
  const key = scope.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const rank = `rank-${key}`
  const rankings = ['cpu', 'memory', ...(runtimeScores(tasks, model).some((s) => s.types) ? ['types'] : [])]
  const basisName = `basis-${key}`
  const rules = rankings.flatMap((id) => Object.keys(BASIS).map((basis) => `.ranked:has(#${rank}-${id}:checked):has(#${basisName}-${basis}:checked) .ranked-panel[data-ranking="${id}"][data-basis="${basis}"]`))
  return `<div class="ranked">
<style>${rules.join(',')}{display:block}</style>
<div class="switches">${switcher(rank, 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}${switcher(basisName, 'Compare', Object.entries(BASIS).map(([id, b]) => ({ id, title: b.title })), 'best')}${orderSwitch(`order-${key}`)}</div>
${rankings.flatMap((id) => Object.keys(BASIS).map((basis) => `<div class="ranked-panel" data-ranking="${id}" data-basis="${basis}">${runtimeCards(tasks, model, scope, id, null, basis)}</div>`)).join('\n')}
${runtimeTable(tasks, model, highlight)}
</div>`
}

function runtimeTable(tasks, model, highlight) {
  const scores = runtimeScores(tasks, model)
  if (scores.length === 0) return ''
  // In each column the first and last of the runtimes listed get the medal
  // and the sad face, doubled when another runtime shows the same figure.
  const shown = (grade) => `${grade.class} ${formatNumber(grade.ratio)}`
  // The medal table. Every task has three events (CPU, memory, type check);
  // in each, the entries on every runtime compete and the best three figures
  // take gold, silver and bronze, shared when equal. A runtime is credited
  // with each medal an entry won on it, as a country is with its athletes'.
  const medalCount = runtimeMedals(tasks)
  const medalCell = (s) => {
    const won = medalCount.get(s.runtime.id) ?? { best: [], second: [], third: [] }
    const total = won.best.length * 1e6 + won.second.length * 1e3 + won.third.length
    return `<td class="l medals" data-v="${total || ''}"><span class="row-marks">${MEDALS.map((kind) => `<span class="tally-slot">${tallyMedal(kind, won[kind].length, `${PLACE_TEXT[kind]}: ${won[kind].join('; ')}`, true) || EMPTY_MEDAL}</span>`).join('')}</span></td>`
  }
  const figure = (rankingId, pick, s) => gradedCell(s[rankingId][pick], `${formatNumber(s[rankingId][pick].ratio)}×${chip(rankingId, s[rankingId][pick])}`)
  // The table starts in medal order: most golds, then silvers, then bronzes.
  const tally = (s) => { const won = medalCount.get(s.runtime.id); return won ? won.best.length * 1e6 + won.second.length * 1e3 + won.third.length : 0 }
  scores.sort((a, b) => tally(b) - tally(a))
  return `<div class="scroll"><table class="sortable">
<caption>${notes([
    'Each figure is a multiple of the best result in any language.',
    'Medals: each task has three events (CPU, memory, type check). In each event, the entries on all runtimes compete. The best three figures get gold, silver and bronze, and equal figures share a medal. A runtime gets each medal that an entry won on it. Hover over a medal for the list. The column sorts by most golds, then silvers, then bronzes.',
    'Best is the geometric mean of the best entry in each task. Tasks without a result are not counted. The Tasks column shows how many are covered.',
    'Typical is the geometric mean of every entry on the runtime. This includes tuned variants, and APIs of other runtimes that run through a compatibility layer.',
    'Runtime memory is all that the process holds after the task and a garbage collection, runtime included. Package memory labels subtract the same runtime with a do-nothing adapter on the same inputs.',
    'Type check compares the type-check cost of the packages on each runtime. The checkers are different (TypeScript, mypy, Sorbet, the Go checker, cargo check), so the comparison shows what type checking costs in each ecosystem. It does not show which checker is better. Built-ins are not counted when a runtime has packages.',
  ])}</caption>
<thead><tr><th scope="col">Runtime or language</th>${MEDALS_HEAD.replace('data-first="descending"', 'data-first="descending" aria-sort="descending"')}${sortable('Entries')}${sortable('Tasks')}${['CPU, best', 'CPU, typical', 'Total memory, best', 'Total memory, typical', 'Type check, best', 'Type check, typical'].map((t) => sortable(t, ' class="marked"')).join('')}</tr></thead>
<tbody>${scores
    .map((s) => `<tr${s.runtime.id === highlight ? ' class="here"' : ''}><td><a href="${urls.runtime(s.runtime.id)}">${inlineIcon(s.runtime.id)}${esc(s.runtime.title)}</a><span class="ver">${esc(s.runtime.version)}</span></td>${medalCell(s)}${cell(s.entries, s.entries)}${cell(s.tasks, `${s.tasks}/${tasks.length}`)}${figure('cpu', 'best', s)}${figure('cpu', 'typical', s)}${figure('memory', 'best', s)}${figure('memory', 'typical', s)}${s.types ? figure('types', 'best', s) + figure('types', 'typical', s) : cell(null, NA) + cell(null, NA)}</tr>`)
    .join('\n')}</tbody></table></div>`
}

// Every task against every runtime: the best entry of each runtime in each
// task, as a multiple of the best result. One table per ranking, behind a
// Rank by switch. `highlight` marks one runtime's column.
function taskRuntimeMatrix(model, highlight) {
  const rankings = Object.keys(RANKINGS)
  const runtimes = byMedals(model)
  const scored = model.categories.flatMap((c) => c.tasks.map((d) => ({ c, d, scores: new Map(runtimeScores([d], model).map((s) => [s.runtime.id, s])) })))
  const table = (id) => `<div class="scroll"><table class="sortable matrix">
<caption>The best entry of each runtime in each task, as a multiple of the best result in any language. A dash means that the runtime has no entry in the task.</caption>
<thead><tr><th scope="col">Task</th>${sortable('Category', ' class="l"')}${runtimes.map((rt) => `<th scope="col" data-col="${esc(rt.title)}" data-fields="grade,value"${rt.id === highlight ? ' class="here"' : ''}>${SORT_SLOT}<button type="button" data-sort>${inlineIcon(rt.id)}${esc(rt.title)}</button></th>`).join('')}</tr></thead>
<tbody>${scored.map(({ c, d, scores }) => `<tr><td>${categoryIcon(c.id, 24)}<a href="${urls.task(d.task.id)}#runtimes">${esc(d.task.title)}</a></td><td class="l"><a href="${urls.category(c.id)}#runtimes">${esc(c.title)}</a></td>${runtimes.map((rt) => {
    const best = scores.get(rt.id)?.[id]?.best
    const here = rt.id === highlight ? ' class="here"' : ''
    return best ? `<td data-grade="${CLASSES.indexOf(best.class)}" data-v="${best.ratio}" data-value="${best.ratio}"${here}>${formatNumber(best.ratio)}×${chip(id, best)}</td>` : `<td data-v=""${here}>${NA}</td>`
  }).join('')}</tr>`).join('\n')}</tbody></table></div>`
  return `<div class="ranked">
<style>${rankings.map((id) => `.ranked:has(#matrix-${id}:checked) .ranked-panel[data-ranking="${id}"]`).join(',')}{display:block}</style>
<div class="switches">${switcher('matrix', 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}</div>
${rankings.map((id) => `<div class="ranked-panel" data-ranking="${id}">${table(id)}</div>`).join('\n')}
</div>`
}

export function runtimesPage(model) {
  return layout({
    title: 'Languages and runtimes compared: Package Efficiency Labels',
    description: 'How runtimes and languages compare for each category of task.',
    path: '/runtimes/',
    formats: { data: true },
    crumbs: [['Languages/Runtimes']],
    model,
    body: `<main>
<h1>Languages and runtimes compared</h1>
<p class="intro">How each runtime or language does on the same tasks. The results describe these tasks only, not the performance of a language in general.</p>
${model.categories.length > 1 ? `<h2>All categories</h2>${runtimeSection(model.tasks, model, 'All categories')}` : ''}
<h2>Every task</h2>
<p class="soft">The full comparison for one task is on the page of that task, and for one category on the page of that category.</p>
${taskRuntimeMatrix(model)}
</main>`,
  })
}

// Every scope a runtime has summary labels in, with the tasks behind it.
export function summaryScopes(model) {
  return [
    ...(model.categories.length > 1 ? [{ key: 'all', title: 'All categories', tasks: model.tasks }] : []),
    ...model.categories.map((c) => ({ key: c.id, title: c.title, tasks: c.tasks, href: urls.category(c.id) })),
    ...model.categories.filter((c) => c.tasks.length > 1).flatMap((c) => c.tasks.map((d) => ({ key: d.task.id, title: d.task.title, tasks: [d], href: urls.task(d.task.id) }))),
  ].map((scope) => ({ ...scope, runtimes: runtimeScores(scope.tasks, model).map((s) => s.runtime) }))
}

// A runtime's summary labels in one scope, on a page of their own: where the
// link on those labels leads. Unlike a single result this is a running
// summary, so the page changes as tasks are added.
export function summaryPage(scope, rt, model) {
  const rankings = ['cpu', 'memory', ...(runtimeScores(scope.tasks, model).some((s) => s.types && s.runtime.id === rt.id) ? ['types'] : [])]
  const row = (basis) => shelf(rankings.map((rankingId) => runtimeCards(scope.tasks, model, scope.title, rankingId, rt.id, basis).replace(/^<ul class="shelf[^"]*">|<\/ul>$/g, '')), { limit: Infinity })
  const title = `${rt.title} in ${scope.title}`
  return layout({
    title: `${title}: Package Efficiency Labels`,
    description: `How ${rt.title} ${rt.version} does in ${scope.title}: its best and its typical entry against the best result in any language, for CPU, memory and type-check cost.`,
    path: urls.summary(rt.id, scope.key),
    crumbs: [['Languages/Runtimes', '/runtimes/'], [rt.title, urls.runtime(rt.id)], [scope.title]],
    model,
    formats: { data: false },
    body: `<main>
<h1>${esc(rt.title)} <span class="ver">${esc(scope.title)}</span></h1>
<p class="intro">A summary of ${esc(rt.title)} ${esc(rt.version)} across ${plural(scope.tasks.length, 'task')} in ${scope.href ? `<a href="${scope.href}">${esc(scope.title)}</a>` : esc(scope.title.toLowerCase())}. Each figure is a multiple of the best result in any language or runtime. This summary changes when tasks are added or measured again. Short link: <a href="${urls.summary(rt.id, scope.key)}"><code>${esc(shortLinkOf(urls.summary(rt.id, scope.key)))}</code></a>.</p>
<h2>Best entry</h2>
<p>The best entry on ${esc(rt.title)} in each task.</p>
${row('best')}
<h2>Typical entry</h2>
<p>The mean of every entry on ${esc(rt.title)}.</p>
${row('typical')}
<p><a href="${urls.runtime(rt.id)}">${esc(rt.title)} in every task</a>, and <a href="/runtimes/">every language and runtime compared</a>.</p>
</main>`,
  })
}

// One runtime across every task it has entries in, beside the others.
export function runtimePage(rt, model) {
  // The categories this runtime has entries in, strongest first: by the CPU
  // cost of its best entries against the best result in any language.
  const ranked = model.categories
    .map((c) => ({ c, tasks: c.tasks.filter((d) => d.runtimes.some((r) => r.id === rt.id)) }))
    .filter(({ tasks }) => tasks.length)
    .map((x) => ({ ...x, ratio: runtimeScores(x.tasks, model).find((s) => s.runtime.id === rt.id)?.cpu?.best.ratio ?? Infinity }))
    .sort((x, y) => x.ratio - y.ratio)
  const section = ({ c, tasks }) => `<h3><a href="${urls.category(c.id)}">${esc(c.title)}</a></h3>
${shelf(['cpu', 'memory', 'types'].map((rankingId) => runtimeCards(tasks, model, c.title, rankingId, rt.id).replace(/^<ul class="shelf[^"]*">|<\/ul>$/g, '')), { limit: Infinity })}
${runtimeTable(tasks, model, rt.id)}`
  // A page for every category would be most of the site again: the five at
  // each end have their labels here, and every task is in the table below.
  const ENDS = 5
  const split = ranked.length > 2 * ENDS
  const sections = split
    ? `<h2>Strongest categories</h2>
<p class="soft">The ${ENDS} categories where the best entries of ${esc(rt.title)} are nearest to the best result in any language, by CPU.</p>
${ranked.slice(0, ENDS).map(section).join('\n')}
<h2>Weakest categories</h2>
<p class="soft">The ${ENDS} categories where they are farthest from it, weakest first.</p>
${ranked.slice(-ENDS).reverse().map(section).join('\n')}`
    : `<h2>Categories</h2>\n${ranked.map(section).join('\n')}`
  const count = model.tasks.filter((d) => d.runtimes.some((r) => r.id === rt.id)).length
  return layout({
    title: `${rt.title}: Package Efficiency Labels`,
    description: `How ${rt.title} compares with other runtimes and languages, task by task.`,
    path: urls.runtime(rt.id),
    formats: { data: true },
    crumbs: [['Languages/Runtimes', '/runtimes/'], [rt.title]],
    model,
    body: `<main>
<h1>${esc(rt.title)} ${esc(rt.version)}</h1>
<p class="intro">${esc(rt.title)} in ${plural(count, 'task')}, compared with every other runtime and language on the same tasks.</p>
${model.categories.length > 1 ? `<h2>All categories</h2>${shelf(['cpu', 'memory', 'types'].map((rankingId) => runtimeCards(model.tasks, model, 'All categories', rankingId, rt.id).replace(/^<ul class="shelf[^"]*">|<\/ul>$/g, '')), { limit: Infinity })}
${runtimeTable(model.tasks, model, rt.id)}` : ''}
${sections}
<h2>Every task</h2>
<p class="soft">${esc(rt.title)} beside every other runtime, in every task. The name of a task opens its full comparison.</p>
${taskRuntimeMatrix(model, rt.id)}
</main>`,
  })
}

// Everything the search box can find.
const MIT_NOTICE = `The MIT License (MIT)

Copyright (c) 2016 Roberto Huertas

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`

// Where the artwork, typeface and package lists come from, and their licences.
// site/assets/marks/README.md and site/assets/README.md list the same sources
// for the files kept in the repository.
// What depends on where the site is published (site.json): the page's own
// address for search engines and link previews once one is set, and a request
// not to be indexed while the site is a work in progress.
function siteMeta(model, { title, description, path, crumbs, markdown }) {
  const site = model?.site ?? {}
  // The host serves a path containing "@" at its "%40" spelling (it redirects
  // the plain one there), so that is the address to name as the page's own.
  const address = site.url && path ? `${site.url}${encodeURI(path).replace(/@/g, '%40')}` : null
  return [
    site.indexable ? '' : '<meta name="robots" content="noindex">',
    address ? `<link rel="canonical" href="${esc(address)}">` : '',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Package Efficiency Labels">',
    address ? `<meta property="og:url" content="${esc(address)}">` : '',
    '<meta name="twitter:card" content="summary">',
    markdown ? `<link rel="alternate" type="text/markdown" href="${esc(markdown)}">` : '',
    // The breadcrumb trail, in the form search engines read.
    site.url && crumbs?.length ? `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', '/'], ...crumbs].map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(href || (i === crumbs.length && address) ? { item: href ? `${site.url}${href}` : address } : {}) })),
    }).replace(/</g, '\\u003c')}</script>` : '',
  ].filter(Boolean).join('\n')
}

// One result on a page of its own, at an address that never changes: the
// entry at this version on this runtime, with its labels and what is behind
// them. This is where a label's own link leads.
export function resultPage(data, runtime, entry, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const pkg = model.packageOf(entry)
  const a = entry.adapter
  const who = a.author?.kind === 'human' ? 'a human' : `${a.author?.agent} (${a.author?.model})`
  const version = entry.builtin ? `built into ${runtime.title}` : entry.version ?? ''
  const cards = Object.keys(RANKINGS).map((rankingId) => card({ entry, data, runtime, rankingId, model, linkPackage: false })).join('\n')
  const title = `${entry.title}${entry.version ? ` ${entry.version}` : ''} on ${runtime.title} ${runtime.version}`
  return layout({
    title: `${title}, ${data.task.title}: Package Efficiency Labels`,
    description: `Efficiency labels for ${entry.title}${entry.version ? ` ${entry.version}` : ''} on ${runtime.title} ${runtime.version} in the ${data.task.title} task: CPU, memory and type-check cost, and how they were measured.`,
    path: urls.result(data.task.id, runtime.id, entry),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.taxonomy, model), [category.title, urls.category(category.id)], [data.task.title, urls.task(data.task.id)], [title]],
    model,
    actions: feedback(model, { scope: 'entry', about: `${entry.title} in ${data.task.title} on ${runtime.title}`, pkg: `${pkg.ecosystem}/${pkg.name}`, task: data.task.id, runtime: runtime.title, source: adapterSource(data.task.id, adapterIdOf(entry)).dir, code: urls.source(data.task.id, adapterIdOf(entry)), page: urls.result(data.task.id, runtime.id, entry), vouch: pkg.ecosystem !== 'builtin' , top: true }),
    body: `<main>
<h1>${esc(entry.title)}${verified(entry.adapter)} <span class="ver">${esc(version)}</span></h1>
<p class="intro">One result: ${esc(entry.title)}${entry.version ? ` ${esc(entry.version)}` : ''} on ${esc(runtime.title)} ${esc(runtime.version)}, in the task <a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a>. The address of this page does not change when a newer version is measured, so you can link to it and cite it. Short link: <a href="${resultShort(data.task.id, runtime.id, entry)}"><code>${esc(resultShortLink(data.task.id, runtime.id, entry))}</code></a>.</p>
<ul class="shelf">
${cards}
</ul>

<h2>Behind the figures</h2>
<ul>
<li>${esc(data.task.summary)}</li>
<li>A class compares this result with the best result in the task, in any language or runtime. <a href="${urls.task(data.task.id)}">Every entry in this task</a>.</li>
<li>Benchmark code written by ${esc(who)}${a.author?.date ? ` on ${esc(a.author.date)}` : ''}, ${reviewOf(a) ? reviewText(a) : '<b>not reviewed by a human</b>'}. <a href="${urls.source(data.task.id, adapterIdOf(entry))}">Read the code</a>.</li>
${a.notes ? `<li>${esc(a.notes)}</li>` : ''}
${a.details ? `<li><details><summary>How this entry is set up, in full</summary><p>${esc(a.details)}</p></details></li>` : ''}
<li>Measured on ${esc(data.machine.cpu)}, ${data.machine.cores} cores, ${esc(data.machine.os)}; ${entry.measurement.runs} runs.</li>
<li><a href="${urls.package(pkg, entry.version !== pkg.version ? entry.version : null)}">${esc(pkg.title)} in every task and runtime</a>.</li>
</ul>
</main>`,
  })
}

// --- Statistics -------------------------------------------------------------

// How many results fall in each class, for every ranking: over the whole
// site, by runtime and by registry. A result is one entry on one runtime in
// one task. Type checking does not depend on the runtime, so there an entry
// counts once per task (and once for each runtime it was checked for when
// counted by runtime).
export function classStats(model) {
  const tally = () => ({ counts: CLASSES.map(() => 0), total: 0 })
  const add = (t, letter) => { t.counts[CLASSES.indexOf(letter)]++; t.total++ }
  return Object.keys(RANKINGS).map((rankingId) => {
    const all = tally(), byRuntime = new Map(model.runtimes.map((rt) => [rt.id, tally()])), byEcosystem = new Map(Object.keys(ECOSYSTEMS).map((id) => [id, tally()]))
    for (const data of model.tasks) {
      const once = new Set()
      for (const runtime of data.runtimes) for (const entry of runtime.entries) {
        const letter = entry.grades[rankingId]?.class
        if (!letter) continue
        add(byRuntime.get(runtime.id), letter)
        if (rankingId === 'types' && once.has(entry.id)) continue
        once.add(entry.id)
        add(all, letter)
        if (byEcosystem.has(entry.ecosystem)) add(byEcosystem.get(entry.ecosystem), letter)
      }
    }
    return {
      rankingId, all,
      runtimes: model.runtimes.map((rt) => ({ id: rt.id, title: rt.title, icon: rt.id, href: urls.runtime(rt.id), ...byRuntime.get(rt.id) })).filter((r) => r.total),
      ecosystems: Object.entries(ECOSYSTEMS).map(([id, e]) => ({ id, title: e.title, icon: `eco-${id}`, href: urls.ecosystem(id), ...byEcosystem.get(id) })).filter((r) => r.total),
    }
  })
}

const share = (count, total) => (total ? `${Math.round((count / total) * 100)}%` : '')
// One class distribution as seven columns, the tallest as tall as the chart.
function classHistogram(rankingId, { counts, total }) {
  const top = Math.max(...counts, 1)
  return `<ol class="histogram" aria-label="${plural(total, 'result')} by class">${counts
    .map((count, i) => {
      const color = RANKINGS[rankingId].colors[i]
      return `<li><span class="count">${count.toLocaleString('en-US')}<small>${share(count, total)}</small></span><span class="bar" style="height:${((count / top) * 100).toFixed(1)}%;background:${color}"></span><span class="cls" style="background:${color};color:${inkOn(color)}">${CLASSES[i]}</span></li>`
    })
    .join('')}</ol>`
}
// The same distribution as one strip, so rows can be compared at a glance.
const classStrip = (rankingId, { counts, total }) =>
  `<span class="class-strip" aria-hidden="true">${counts.map((count, i) => (count ? `<span style="flex:${count};background:${RANKINGS[rankingId].colors[i]}"></span>` : '')).join('')}</span>`
// Where a row's results sit on average, from 0 (all A) to 6 (all G): what the
// strip column sorts by.
const averageClass = ({ counts, total }) => counts.reduce((sum, count, i) => sum + count * i, 0) / total
const averageLetter = (row) => { const at = averageClass(row), i = Math.round(at); return `${CLASSES[i]}${Math.abs(at - i) < 0.17 ? '' : at < i ? ', towards ' + CLASSES[i - 1] : ', towards ' + CLASSES[i + 1]}` }
// The class of the middle result, and how far results sit from the mean
// class (standard deviation, in classes).
const medianClass = ({ counts, total }) => { let seen = 0; return counts.findIndex((count) => (seen += count) >= total / 2) }
const classSpread = (row) => Math.sqrt(row.counts.reduce((sum, count, i) => sum + count * (i - averageClass(row)) ** 2, 0) / row.total)
function classTable(rankingId, first, rows) {
  return `<div class="scroll"><table class="sortable class-table">
<thead><tr><th scope="col">${first}</th>${sortable('Results')}${CLASSES.map((letter, i) => sortable(`<span class="cls" style="background:${RANKINGS[rankingId].colors[i]};color:${inkOn(RANKINGS[rankingId].colors[i])}">${letter}</span>`)).join('')}<th scope="col" class="l" data-col="Share by class" data-fields="mean,median,spread" data-cycle="fields" data-field="mean" aria-sort="ascending" title="Each click sorts by the next of: mean class, median class, how widely the results spread (standard deviation). After the third, the order reverses"><button type="button" data-sort>Share by class</button><small class="sort-field" aria-live="polite">mean</small></th></tr></thead>
<tbody>${[...rows].sort((a, b) => averageClass(a) - averageClass(b))
    .map((row) => `<tr><td>${inlineIcon(row.icon)}<a href="${row.href}">${esc(row.title)}</a></td>${cell(row.total, row.total.toLocaleString('en-US'))}${row.counts.map((count) => cell(count, count ? `${count.toLocaleString('en-US')}<small>${share(count, row.total)}</small>` : '<span class="soft">0</span>')).join('')}<td class="l" data-v="${averageClass(row).toFixed(4)}" data-mean="${averageClass(row).toFixed(4)}" data-median="${(medianClass(row) + averageClass(row) / 100).toFixed(4)}" data-spread="${classSpread(row).toFixed(4)}" title="Mean class ${averageLetter(row)}; median ${CLASSES[medianClass(row)]}; standard deviation ${classSpread(row).toFixed(1)} classes">${classStrip(rankingId, row)}</td></tr>`)
    .join('\n')}</tbody></table></div>`
}

export function statsPage(model) {
  const stats = classStats(model)
  return layout({
    title: 'Statistics: Package Efficiency Labels',
    description: 'How many results fall in each efficiency class, A to G, for CPU, memory and type-check cost: overall, by runtime and by package registry.',
    path: '/stats/',
    crumbs: [['Statistics']],
    model,
    body: `<main>
<h1>Statistics</h1>
<p class="intro">How many results are in each class. A result is one entry on one runtime in one task. An entry is a package, a built-in, or a tuned variant of one. Its class compares it with the best result in that task, in any language. ${plural(model.tasks.length, 'task')} are measured.</p>
${stats
  .map((s) => `<section class="stats">
<h2>${scaleIcon(s.rankingId)}${esc(RANKINGS[s.rankingId].title)}</h2>
${classHistogram(s.rankingId, s.all)}
<p class="soft">${plural(s.all.total, 'result')}.${s.rankingId === 'types' ? ' Type-check cost does not depend on the runtime. Here an entry counts once per task. In the table by runtime, it counts once for each of its runtimes.' : ''}</p>
<h3>By language and runtime</h3>
${classTable(s.rankingId, 'Runtime', s.runtimes)}
<h3>By registry</h3>
${classTable(s.rankingId, 'Registry', s.ecosystems)}
</section>`)
  .join('\n')}
<h2>Class boundaries</h2>
<p>A class is a multiple of the best result in the task. The default boundaries are these. CPU: 1.5×, 3×, 6×, 12×, 25× and 50× the best, then G. Memory: 1.5×, 2.5×, 4×, 6.5×, 10× and 16×, because memory results are closer together. Type-check cost is a time multiplied by a memory figure, so its boundaries are the products of the two: 2.25×, 7.5×, 24×, 78×, 250× and 800×. A task can set its own boundaries, and each task page shows the ones that it uses.</p>
</main>`,
  })
}

export function statsMarkdown(model) {
  const table = (first, rows) => `| ${first} | Results | ${CLASSES.join(' | ')} |\n| --- | ---: | ${CLASSES.map(() => '---:').join(' | ')} |\n${rows.map((r) => `| ${r.title} | ${r.total} | ${r.counts.join(' | ')} |`).join('\n')}`
  return `# Statistics: Package Efficiency Labels\n\nHow many results fall in each class, A (best) to G. A result is one entry on one runtime in one task, graded against the best result in that task in any language. ${plural(model.tasks.length, 'task')} are measured so far.\n\n${classStats(model)
    .map((s) => `## ${RANKINGS[s.rankingId].title}\n\n${table('Scope', [{ title: 'All results', ...s.all }])}\n\n### By language and runtime\n\n${table('Runtime', s.runtimes)}\n\n### By registry\n\n${table('Registry', s.ecosystems)}`)
    .join('\n\n')}\n`
}

export function notFoundPage(model) {
  return layout({
    title: 'Page not found: Package Efficiency Labels',
    description: 'There is no page at this address.',
    path: null,
    crumbs: [['Page not found']],
    model,
    formats: null,
    body: `<main>
<h1>Page not found</h1>
<p class="intro">There is no page at this address. Possibly a package, task or category has a new name or was removed.</p>
<p>Search from the bar above (press <kbd>/</kbd>), or start from <a href="/">Home</a>, <a href="/categories/">Categories</a>, <a href="/tasks/">Tasks</a> or <a href="/packages/">Packages</a>.</p>
</main>`,
  })
}

export function creditsPage(model) {
  const link = (href, text) => `<a href="${href}">${text}</a>`
  const marks = [
    [`${inlineIcon('node')} ${inlineIcon('deno')} ${inlineIcon('rust')} ${inlineIcon('python')} ${inlineIcon('ruby')} ${inlineIcon('eco-jsr')} ${inlineIcon('eco-rubygems')}`, 'One-colour marks beside names: Node.js, Bun, Deno, Rust, JavaScript, TypeScript, Python, PyPy, Ruby, Go, JSR, RubyGems', link('https://simpleicons.org', 'Simple Icons'), 'CC0 1.0', 'Unchanged'],
    ['', 'Colour marks on the labels: Node.js, Bun, Deno, Rust, TypeScript, Python, Ruby, Go', `${link('https://github.com/gilbarbara/logos', 'SVG Logos')} by Gil Barbara`, 'CC0 1.0', 'Unchanged'],
    
    [inlineIcon('eco-pypi'), 'PyPI', `${link('https://github.com/gilbarbara/logos', 'SVG Logos')} by Gil Barbara`, 'CC0 1.0', 'Traced over the logo as a line drawing: every visible cube edge and the two eyes, in one colour'],
    [inlineIcon('eco-gomod'), 'Go modules', `The Go gopher, designed by ${link('https://reneefrench.blogspot.com', 'Renee French')}. Artwork from ${link('https://github.com/vscode-icons/vscode-icons', 'vscode-icons')}`, `Gopher: ${link('https://creativecommons.org/licenses/by/3.0/', 'CC BY 3.0')}. Artwork: MIT`, 'Redrawn as an outline'],
    [inlineIcon('eco-cargo'), 'crates.io', `The Cargo logo, from the Rust project. Artwork from ${link('https://github.com/vscode-icons/vscode-icons', 'vscode-icons')}`, 'Artwork: MIT', 'Redrawn as a line drawing of the mark\'s shape: the crates on their pallet, markings left out'],
    [inlineIcon('eco-npm'), 'npm', 'The letters of the npm logo, drawn for this site', '', ''],
    [inlineIcon('ruby-yjit'), 'YJIT, beside names and on labels', `The logo in the ${link('https://github.com/Shopify/yjit', 'Shopify/yjit')} README`, '', 'Unchanged on labels; beside names the diamond is redrawn as lines'],
    [WRENCH.replace('role="img" aria-label="Tuned"', 'aria-hidden="true"'), 'Tuned settings', `${link('https://fonts.google.com/icons', 'Material Icons')} by Google`, 'Apache 2.0', 'Unchanged'],
  ]
  return layout({
    title: 'Credits: Package Efficiency Labels',
    description: 'Sources and licences of the logos, icons, typeface and package lists used on this site.',
    path: '/credits/',
    crumbs: [['Credits']],
    model,
    body: `<main>
<h1>Credits</h1>
<p class="intro">This site uses the artwork of other people to identify runtimes, languages and package registries. The names and logos belong to their projects. Their use here does not mean that those projects endorse this site or are affiliated with it.</p>
<h2>Logos and icons</h2>
<div class="scroll"><table class="credits">
<thead><tr><th></th><th>Used for</th><th>Source</th><th>Licence</th><th>Changes</th></tr></thead>
<tbody>
${marks.map(([icon, use, source, licence, changes]) => `<tr><td class="marks">${icon}</td><td>${use}</td><td>${source}</td><td>${licence || '—'}</td><td>${changes || '—'}</td></tr>`).join('\n')}
</tbody>
</table></div>
<p>The category drawings, the efficiency scales and the other interface icons were made for this site.</p>
<details class="licence"><summary>MIT licence notice for the vscode-icons artwork</summary><pre>${esc(MIT_NOTICE)}</pre></details>
<h2>Code highlighting</h2>
<p>The benchmark source is highlighted at build time with ${link('https://highlightjs.org', 'highlight.js')}, under the BSD 3-Clause licence.</p>
<h2>Typeface</h2>
<p>${link('https://fonts.google.com/specimen/Archivo', 'Archivo')} by Omnibus-Type, under the SIL Open Font License 1.1, served by Google Fonts.</p>
<h2>Package lists</h2>
<p>The lists of most used packages, from which the categories were made, come from ${link('https://packages.ecosyste.ms', 'ecosyste.ms Packages')} (CC BY-SA 4.0) for npm, crates.io, PyPI, RubyGems and Go modules, and from the ${link('https://jsr.io', 'JSR')} registry for JSR.</p>
<h2>Label design</h2>
<p>The labels look like the European Union energy label. They are not energy labels, and they are not an official rating: no regulator issued them or checked them.</p>
<h2>Benchmarked software</h2>
<p>Each package, runtime and compiler measured here is the work of its authors, and is used under its licence. Each package page has a link to its registry entry.</p>
</main>`,
  })
}

// --- The catalog: every listed package, measured or not --------------------

// The most used packages of each ecosystem are all listed, so a reader who
// looks one up finds it, with its category and whether it has been measured.
export const categoryHref = (id, model) => {
  const measured = model.categories.find((c) => c.taxonomy === id)
  return measured ? urls.category(measured.id) : `/${id}/`
}
export const catalogUrl = (item) => (item.measured ? urls.package(item.measured) : `/${item.ecosystem}/${item.name}/`)
const STATUS_ORDER = ['Measured', 'Not measured yet', 'No comparable task']
export const statusOf = (item) => (item.measured ? 'Measured' : item.category?.benchmarkable ? 'Not measured yet' : item.category && item.category.id !== 'other' ? 'No comparable task' : 'Not measured yet')
const compact = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n))

// A measured package's best class for CPU and for memory, on any runtime and
// in any task, as two small chips.
const bestClasses = (pkg) =>
  ['cpu', 'memory']
    .map((id) => {
      const grades = pkg.appearances.map((a) => a.entry.grades[id]).filter((g) => g?.class)
      return grades.length ? chip(id, grades.reduce((a, b) => (CLASSES.indexOf(b.class) < CLASSES.indexOf(a.class) ? b : a)), `Best ${RANKINGS[id].title} class`) : ''
    })
    .join('')

// Where a class would be, for a figure that has none: a box with a stroke through it.
const NO_CLASS = '<span class="cls none" title="No class: there is nothing to compare it with" role="img" aria-label="No class">/</span>'
// A listed package's type-check cost: its two parts, the cost, and its class
// where its category gives it one.
function typeCell(types) {
  if (!types) return cell(null, NA)
  const html = `<span class="type-cost"><span>${communityMark(types)}${types.cpuMs < 10 ? '&lt; 10' : formatNumber(types.cpuMs)} ms</span><span>${esc(formatAtLeast(types.memoryMb, LEAST.memory))} MB</span><span class="type-cost-score">${esc(formatAtLeast(types.cost, LEAST.types))} <span class="unit">MB·s</span></span><span class="type-cost-grade">${types.grade ? chip('types', types.grade) : NO_CLASS}</span></span>`
  return types.grade ? gradedCell({ ...types.grade, value: types.cost }, html) : `<td data-v="${types.cost}" data-value="${types.cost}">${html}</td>`
}
function catalogTable(items, model, { showEcosystem = false, caption }) {
  const rows = items.map((item) => {
    const status = statusOf(item)
    const category = item.category
    return `<tr data-status="${status}"${showEcosystem ? ` data-ecosystem="${esc(ECOSYSTEMS[item.ecosystem].title)}"` : ''}><td><a href="${catalogUrl(item)}">${esc(item.name)}</a></td>
${showEcosystem ? `<td class="l">${inlineIcon(`eco-${item.ecosystem}`)}${esc(ECOSYSTEMS[item.ecosystem].title)}</td>` : ''}
${item.rank ? `<td data-v="${item.rank}">${item.rank}</td>` : cell(null, NA)}
${item.popularity ? `<td data-v="${showEcosystem ? item.share : item.popularity.value}" title="${esc(item.popularity.label)}">${compact(item.popularity.value)}</td>` : cell(null, NA)}
<td class="l">${category ? `<a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>` : NA}</td>
${typeCell(item.typeCheck)}
<td class="l${status === 'Measured' ? '' : ' soft'}" data-v="${STATUS_ORDER.indexOf(status)}">${status}${item.measured ? bestClasses(item.measured) : ''}</td></tr>`
  })
  const typed = items.some((item) => item.typeCheck)
  return `<div class="scroll"><table class="sortable" data-md="catalog" data-filters="status${showEcosystem ? ',ecosystem' : ''}">
<caption>${caption}${typed ? ' Type check: added compiler CPU time, added memory, then the cost in bold. Its class compares the package with the lowest-cost package of its category.' + (items.some((item) => item.typeCheck?.community) ? ' An asterisk marks a figure from community types, which the authors of the package did not publish.' : '') : ''}</caption>
<thead><tr><th scope="col">Package</th>${showEcosystem ? sortable('Ecosystem', ' class="l"') : ''}${sortable('Rank')}${sortable('Use')}${sortable('Category', ' class="l"')}${sortableGraded('Type check')}${sortable('Status', ' class="l"')}</tr></thead>
<tbody>${rows.join('\n')}</tbody>
</table></div>`
}

// A share of an ecosystem's listed use, as a percentage with two figures.
const sharePct = (v) => `${(v * 100).toFixed(v >= 0.0995 ? 0 : v >= 0.00995 ? 1 : 2)}%`
const categoryShare = (model, taxonomyId) => model.catalog.categoryShare?.get(taxonomyId) ?? 0

const USE_NOTE = 'The registries count use differently, so the Use column sorts by the share of a package in its own registry. Use is downloads per month for npm and PyPI, total downloads for crates.io and RubyGems, downloads in the last 90 days for JSR, and dependent repositories for Go modules.'

// Every package the site knows: the listed ones of each registry, and the
// measured ones that are not on any list (less used packages and runtime
// built-ins), which have no rank or use figure. Most used first.
export function allKnownPackages(model) {
  const listed = Object.values(model.catalog.byEcosystem).flat()
  const unlisted = model.packages
    .filter((pkg) => !pkg.listed)
    .map((pkg) => ({
      ecosystem: pkg.ecosystem,
      name: pkg.title,
      rank: null,
      popularity: null,
      share: 0,
      version: pkg.version,
      repository: null,
      category: model.catalog.categories.find((c) => c.id === model.categories.find((m) => m.id === pkg.appearances[0].data.task.category)?.taxonomy) ?? null,
      measured: pkg,
    }))
  return [...listed, ...unlisted].sort((a, b) => b.share - a.share || !!b.measured - !!a.measured || a.name.localeCompare(b.name))
}

// The page of a listed package that has no benchmark results.
export function catalogPackagePage(item, model) {
  const eco = ECOSYSTEMS[item.ecosystem]
  const category = item.category
  const status = statusOf(item)
  const measuredCategory = category && model.categories.find((c) => c.taxonomy === category.id)
  const why =
    status === 'No comparable task'
      ? `It is filed under <a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>, a group that has no one task that all its members can run. Thus there is nothing to compare.`
      : !category || category.id === 'other'
        ? 'It can be measured, but it has no category of comparable packages yet.'
        : measuredCategory
          ? `Its category, <a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>, is measured, but this package has no adapter yet.`
          : `Its category, <a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>, has a candidate task, but is not measured yet.`
  const types = item.typeCheck
  // Why a package with a type-check figure has no class for it.
  const noClass = !types || types.grade ? '' : !category || category.id === 'other' ? 'No class: it has no category of comparable packages.' : !category.benchmarkable ? `No class: ${category.title} is a group with no comparable task.` : `No class: it is the only package in ${category.title} with a type-check figure, so there is nothing to compare it with.`
  return layout({
    title: `${item.name}: Package Efficiency Labels`,
    description: `${item.name} is ${item.picked ? `a ${eco.title} package` : `one of the most used ${eco.title} packages`}. It is not measured yet.`,
    path: catalogUrl(item),
    context: { listed: item.category?.id },
    crumbs: [['Packages', '/packages/'], [eco.title, urls.ecosystem(item.ecosystem)], [item.name]],
    model,
    actions: feedback(model, { scope: 'listed', about: item.name, pkg: `${item.ecosystem}/${item.name}`, category: category?.id, page: catalogUrl(item), vouch: false , top: true }),
    body: `<main>
<h1>${esc(item.name)}${item.version ? ` <span class="ver">${esc(item.version)}</span>` : ''}</h1>
<p class="intro">${esc(eco.title)} package, ${item.rank ? `number ${item.rank} by ${esc(item.popularity.label)} (${compact(item.popularity.value)})` : `outside the most used on ${esc(eco.title)} and added by hand${item.popularity.value ? ` (${compact(item.popularity.value)} ${esc(item.popularity.label)})` : ''}`}.${item.description ? ` ${esc(item.description)}` : ''}</p>
<p class="note"><b>${status}.</b> ${why}</p>

<table class="narrow facts">
<tbody>
<tr><th scope="row">Category</th><td class="l">${category ? `<a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>` : NA}</td></tr>
${category?.benchmarkIdea ? `<tr><th scope="row">Candidate task</th><td class="l wrap">${esc(category.benchmarkIdea)}</td></tr>` : ''}
<tr><th scope="row">Registry</th><td class="l"><a href="${eco.registry(item.name)}">${esc(eco.title)}</a>${item.repository ? `, <a href="${esc(item.repository)}">source repository</a>` : ''}</td></tr>
</tbody>
</table>
${types ? `<h2>Type check</h2>
<ul class="shelf"><li>${renderLabel({
    entry: { title: item.name, grades: { types: types.grade ?? { class: null, value: types.cost } }, types: { icon: types.icon ?? 'typescript', cpuMs: types.cpuMs, memoryMb: types.memoryMb, community: types.community }, metrics: { importMs: null }, adapter: { notes: `${types.grade ? `Class A is the lowest-cost package in ${category.title}: ${types.anchor.title}${types.anchor.version ? ` ${types.anchor.version}` : ''}.` : noClass} This package has no benchmark yet, so it has no CPU or memory class.` }, flags: [] },
    data: { metrics: {}, typeChecks: { typescript: { unit: 'MB·s', headline: 'MB·s of type-check cost (CPU seconds × MB)', tool: types.tool } } },
    runtime: { id: 'node', title: '', version: '' },
    rankingId: 'types',
    subtitle: item.version ? `Version ${item.version}` : '',
    context: `Type check, ${types.tool}`,
    address: catalogUrl(item),
  })}</li></ul>
<p>With ${esc(types.tool)}, the types of this package add ${formatNumber(types.cpuMs)} ms of compiler CPU time and ${formatNumber(types.memoryMb)} MB of compiler memory. That is a cost of <b>${formatNumber(types.cost)} MB·s</b>. ${types.community ? `* The types come from a community package${types.from ? ` (${esc(types.from)})` : ''}, not from the authors of this package. ` : ''}${types.grade ? `Its class compares it with the lowest-cost package in <a href="${categoryHref(category.id, model)}">${esc(category.title)}</a>, which is <b>${esc(types.anchor.title)}</b>${types.anchor.version ? ` ${esc(types.anchor.version)}` : ''}.` : esc(noClass)}</p>
${TYPE_KEY}` : ''}
</main>`,
  })
}

// A category from the categorization that has no measured task: what it
// covers, its candidate task if it has one, and the listed packages in it.
export function listedCategoryPage(category, model) {
  const members = model.catalog.byCategory.get(category.id) ?? []
  return layout({
    title: `${category.title}: Package Efficiency Labels`,
    description: category.description,
    path: `/${category.id}/`,
    formats: { data: members.length > 0 },
    context: { listed: category.id },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.id, model), [category.title]],
    model,
    body: `<main>
<h1>${categoryIcon(category.id, 48)}${esc(category.title)}</h1>
<p class="intro">${esc(category.description)}</p>
<p class="note"><b>${category.benchmarkable ? 'Not measured yet.' : 'No comparable task.'}</b> ${category.benchmarkable ? `Candidate task: ${esc(category.benchmarkIdea ?? 'not written yet')}` : 'The packages in this group have no one job that all of them can run the same way. They are listed, but not compared.'}</p>
<h2>Packages</h2>
${members.length ? catalogTable(members, model, { showEcosystem: true, caption: `${plural(members.length, 'listed package')} in this category. ${USE_NOTE}` }) : '<p>No listed package is in this category.</p>'}
</main>`,
  })
}

// --- Copy and download ------------------------------------------------------

const MENU_ICONS = {
  copy: 'M5 1h9v10h-3v3H2V4h3zm1.500 3H11v5.500h1.500v-7h-6zM3.500 5.500v7h6v-7z',
  markdown: 'M1 3h14v10H1zm1.500 1.500v7h11v-7zM4 10.500v-5h1.300L6.500 7.300l1.200-1.800H9v5H7.700V7.800L6.500 9.500 5.300 7.800v2.700zm6-2h1.200v-3h1.100v3h1.200L11.750 10.500z',
  chat: 'M2 2h12v9H8.500L5 14v-3H2zm1.500 1.500v6h3v1.700l2-1.700h4v-6z',
  table: 'M1 2h14v12H1zm1.500 1.500V6H6V3.500zm5 0V6h6V3.500zM2.500 7.500v2H6v-2zm5 0v2h6v-2zm-5 3.500v1.500H6V11zm5 0v1.500h6V11z',
  braces: 'M6 2v1.500H5.200c-.4 0-.7.300-.7.700v2.300c0 .700-.400 1.200-1 1.500.6.300 1 .800 1 1.500v2.300c0 .400.300.700.700.700H6V14H5.200C4 14 3 13 3 11.800V9.500c0-.400-.300-.700-.700-.700H2V7.200h.300c.400 0 .700-.300.700-.700V4.200C3 3 4 2 5.200 2zm4 0h.800C12 2 13 3 13 4.200v2.300c0 .400.300.700.700.700h.3v1.600h-.300c-.400 0-.700.300-.700.700v2.300c0 1.200-1 2.200-2.200 2.200H10v-1.500h.800c.400 0 .700-.300.700-.700V9.500c0-.700.400-1.200 1-1.500-.600-.300-1-.800-1-1.500V4.200c0-.400-.300-.700-.700-.700H10z',
}
// Assistants that accept a question in the address of a new chat. The page
// script fills in the address; without it the links open the Markdown.
const ASSISTANTS = [['chatgpt', 'ChatGPT'], ['claude', 'Claude'], ['perplexity', 'Perplexity'], ['grok', 'Grok'], ['deepseek', 'DeepSeek'], ['kimi', 'Kimi'], ['zai', 'Z.ai']]
const menuIcon = (id) => `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><path d="${MENU_ICONS[id]}" fill="currentColor" fill-rule="evenodd"/></svg>`

// A page's results in other forms: Markdown to paste into a language model,
// CSV and JSON for everything else. Without the page script it is a plain
// list of links; the script adds "Copy page" and closes it on a click outside.
function pageMenu({ markdown, csv, json }) {
  const item = (icon, href, title, detail, attrs = '') => `<li><a href="${href}"${attrs}>${menuIcon(icon)}<span><b>${title}</b><small>${detail}</small></span></a></li>`
  return `<div class="page-menu" data-markdown="${markdown}">
<details class="menu"><summary>${menuIcon('copy')}<span class="menu-title">Copy and download</span></summary>
<ul>
${item('markdown', markdown, 'View as Markdown', 'The full page as plain text, with every row')}
${csv ? item('table', csv, 'Download CSV', 'The rows on this page, for a spreadsheet', ' download') : ''}
${json ? item('braces', json, 'Download JSON', 'The same rows as structured data', ' download') : ''}
<li class="assistants">${ASSISTANTS.map(([id, title]) => `<a href="${markdown}" data-assistant="${id}" title="Ask ${title} about this page" rel="noopener">${assistantIcon(id)}<small>${title}</small></a>`).join('')}</li>
</ul>
</details>
</div>`
}

// --- Benchmark source ---------------------------------------------------------

// A link into the repository named in site.json: kind is "blob" or "tree".
const repoUrl = (model, kind, file) => `${model.repository.url}/${kind}/${model.repository.branch}/${file.split('/').map(encodeURIComponent).join('/')}`

// One file: its name, a link to it on GitHub, and the highlighted code with
// line numbers in a column of their own so they are not selected with it.
// Each file folds; settings and glue start folded when shown inside a page.
const SETTINGS_FILES = new Set(['adapter.json', 'package.json', 'Cargo.toml', 'go.mod', 'runner.go', 'task.json'])
function sourceFile(file, model, { open = true, id = file.name } = {}) {
  const numbers = Array.from({ length: file.lines }, (_, i) => i + 1).join('\n')
  return `<details class="source" id="${esc(id)}"${open ? ' open' : ''}>
<summary><span class="name">${esc(file.name)}</span><span class="soft">${plural(file.lines, 'line')}</span><a href="${repoUrl(model, 'blob', file.path)}">View on GitHub</a></summary>
<div class="code"><pre class="numbers" aria-hidden="true">${numbers}</pre><pre><code>${file.html}</code></pre></div>
</details>`
}

// An adapter's files, for showing inside another page: the code open, its
// settings folded. A variant adds the code it runs unless `withShared` is off
// (when that adapter is already shown on the same page).
function inlineSource(taskId, adapterId, model, { withShared = true, shownApps } = {}) {
  const source = adapterSource(taskId, adapterId)
  // A shared application is shown once on a page, folded, and named after that.
  let app = ''
  if (source.app) {
    const name = source.app.dir.split('/_shared/')[1]
    if (shownApps?.has(source.app.dir)) app = `<p class="soft">It runs the same application as above, <code>${esc(name)}</code>.</p>`
    else {
      shownApps?.add(source.app.dir)
      app = `<p class="soft">The application it runs, shared by every task of this category (<a href="${repoUrl(model, 'tree', source.app.dir)}">${esc(name)} on GitHub</a>):</p>\n${source.app.files.map((f) => sourceFile(f, model, { open: false, id: `${source.app.dir}/${f.name}` })).join('\n')}`
    }
  }
  const show = (f, name = f.name) => sourceFile({ ...f, name }, model, { open: !SETTINGS_FILES.has(f.name), id: `${taskId}/${adapterId}/${name}` })
  const shared = withShared ? source.shared.map((f) => show(f, `${source.variantOf.split('/').at(-1)}/${f.name}`)) : []
  return [...source.files.map((f) => show(f)), ...shared, app].join('\n')
}

const fileIndex = (files) => (files.length > 1 ? `<p class="files">${files.map((f) => `<a href="#${esc(f.name)}">${esc(f.name)}</a>`).join(' ')}</p>` : '')

export function taskSourcePage(data, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const files = taskSource(data.task.id)
  const adapters = [...new Map(data.runtimes.flatMap((r) => r.entries).map((e) => [adapterIdOf(e), e])).entries()]
  return layout({
    title: `${data.task.title}, benchmark source: Package Efficiency Labels`,
    description: `The definition and scenario of the ${data.task.title} benchmark.`,
    path: urls.source(data.task.id),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.taxonomy, model), [category.title, urls.category(category.id)], [data.task.title, urls.task(data.task.id)], ['Source']],
    model,
    body: `<main>
<h1>${esc(data.task.title)} <span class="ver">benchmark source</span></h1>
<p class="intro">What each entry in this task must do: the rules, the load settings, and the scenario that checks every adapter. <a href="${repoUrl(model, 'tree', `benchmarks/${data.task.id}`)}">This folder on GitHub</a>. All tasks use the same <a href="${repoUrl(model, 'tree', 'harness')}">harness</a> to start and measure the adapters.</p>
${fileIndex(files)}
${files.map((f) => sourceFile(f, model)).join('\n')}
<h2>Adapters</h2>
<p class="files">${adapters.map(([id, e]) => `<a href="${urls.source(data.task.id, id)}">${esc(e.title)}</a>`).join(' ')}</p>
</main>`,
  })
}

export function adapterSourcePage(data, adapterId, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const entry = data.runtimes.flatMap((r) => [...r.entries, ...r.history]).find((e) => adapterIdOf(e) === adapterId)
  const source = adapterSource(data.task.id, adapterId)
  const pkg = model.packageOf(entry)
  const shared = source.variantOf
    ? `<h2>Code it runs</h2>
<p>This entry is a variant: it runs the adapter of ${data.runtimes.some((r) => [...r.entries, ...r.history].some((e) => adapterIdOf(e) === source.variantOf)) ? `<a href="${urls.source(data.task.id, source.variantOf)}">${esc(source.variantOf.split('/').at(-1))}</a>` : esc(source.variantOf.split('/').at(-1))} with the settings above.</p>
${source.shared.map((f) => sourceFile({ ...f, name: `${source.variantOf.split('/').at(-1)}/${f.name}` }, model)).join('\n')}`
    : ''
  return layout({
    title: `${entry.title}, ${data.task.title} benchmark source: Package Efficiency Labels`,
    description: `Source code of the ${entry.title} adapter for the ${data.task.title} benchmark.`,
    path: urls.source(data.task.id, adapterId),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], ...groupCrumb(category.taxonomy, model), [category.title, urls.category(category.id)], [data.task.title, urls.task(data.task.id)], ['Source', urls.source(data.task.id)], [entry.title]],
    model,
    actions: feedback(model, { scope: 'entry', about: `${entry.title} in ${data.task.title}`, pkg: pkg ? `${pkg.ecosystem}/${pkg.name}` : undefined, task: data.task.id, source: source.dir, code: urls.source(data.task.id, adapterId), page: urls.source(data.task.id, adapterId), vouch: Boolean(pkg) && pkg.ecosystem !== 'builtin' , top: true }),
    body: `<main>
<h1>${esc(entry.title)}${verified(entry.adapter)} <span class="ver">benchmark source</span></h1>
<p class="intro">The adapter that runs ${pkg ? `<a href="${urls.package(pkg)}">${esc(pkg.title)}</a>` : esc(entry.title)} in <a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a>. <a href="${repoUrl(model, 'tree', source.dir)}">This folder on GitHub</a>. See also <a href="${urls.source(data.task.id)}">the task and its scenario</a>.</p>

${fileIndex(source.files)}
${source.files.map((f) => sourceFile(f, model)).join('\n')}
${shared}
${source.app ? `<h2>The application it runs</h2>\n<p class="soft">One application is shared by every task of this category. <a href="${repoUrl(model, 'tree', source.app.dir)}">This folder on GitHub</a>.</p>\n${fileIndex(source.app.files)}\n${source.app.files.map((f) => sourceFile(f, model, { open: f.lines <= 120 })).join('\n')}` : ''}
</main>`,
  })
}

export function searchIndex(model) {
  // `a` lists a category's other names: searching for one finds the category.
  const also = (id) => (model.catalog.aliases?.[id]?.length ? { a: model.catalog.aliases[id] } : {})
  return [
    // `r` is a package's rank in its registry, so that among matches of the
    // same quality the more used package comes first.
    // `i` names the icon file shown beside the result.
    // `v` is the check its page carries: m for the package's authors, h for another person.
    ...model.packages.map((p) => ({ t: p.title, k: ECOSYSTEMS[p.ecosystem].title, i: `eco-${p.ecosystem}`, u: urls.package(p), ...(p.listed ? { r: p.listed.rank } : {}), ...(reviewOfAll(p.appearances.filter((a) => a.entry.version === p.version).map((a) => a.entry)) ? { v: reviewOfAll(p.appearances.filter((a) => a.entry.version === p.version).map((a) => a.entry))[0] } : {}) })),
    ...model.tasks.map((d) => ({ t: d.task.title, k: 'Task', i: categoryMark(d.task.category), u: urls.task(d.task.id) })),
    ...model.categories.map((c) => ({ t: c.title, k: 'Category', i: categoryMark(c.id), u: urls.category(c.id), ...also(c.taxonomy ?? c.id) })),
    ...Object.entries(ECOSYSTEMS).map(([id, e]) => ({ t: e.title, k: 'Ecosystem', i: `eco-${id}`, u: urls.ecosystem(id) })),
    ...model.runtimes.map((rt) => ({ t: rt.title, k: 'Runtime', i: rt.id, u: urls.runtime(rt.id) })),
    ...model.catalog.categories.filter((c) => !model.categories.some((m) => m.taxonomy === c.id)).map((c) => ({ t: c.title, k: c.benchmarkable ? 'Category, not measured yet' : 'Category', i: categoryMark(c.id), u: `/${c.id}/`, ...also(c.id) })),
    ...Object.values(model.catalog.byEcosystem).flat().filter((item) => !item.measured).map((item) => ({ t: item.name, k: `${ECOSYSTEMS[item.ecosystem].title}, not measured`, i: `eco-${item.ecosystem}`, u: catalogUrl(item), r: item.rank ?? 100000 })),
  ]
}
