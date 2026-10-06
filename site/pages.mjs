// HTML for the static site, rendered from the site model built in
// scripts/build-site.mjs. All links are root-relative.
import { readdirSync, readFileSync } from 'node:fs'
import { activeReleaseRows } from '../scripts/lib/releases.mjs'
import { inlineIcon } from './icons.mjs'
import { adapterIdOf, adapterSource, taskSource } from './source.mjs'
import { CLASSES, RANKINGS, classColor, formatNumber, inkOn, metricFor, renderLabel } from './label.mjs'

const esc = (text) => String(text ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const plural = (n, word) => `${n} ${n === 1 ? word : word.endsWith('y') ? `${word.slice(0, -1)}ies` : `${word}s`}`
const NA = '<span class="na" aria-label="not applicable">—</span>'
const num = (value, unit = '') => (value === null || value === undefined ? NA : `${formatNumber(value)}${unit}`)

export const ECOSYSTEMS = {
  npm: { title: 'npm', registry: (name) => `https://www.npmjs.com/package/${name}` },
  jsr: { title: 'JSR', registry: (name) => `https://jsr.io/${name}` },
  pypi: { title: 'PyPI', registry: name => `https://pypi.org/project/${name}/` },
  rubygems: { title: 'RubyGems', registry: name => `https://rubygems.org/gems/${name}` },
  gomod: { title: 'Go modules', registry: name => `https://pkg.go.dev/${({chi:'github.com/go-chi/chi/v5',gin:'github.com/gin-gonic/gin'})[name] ?? name}` },
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
  source: (taskId, adapterId) => `/source/${taskId}/${adapterId ? `${adapterId}/` : ''}`,
  label: (taskId, runtimeId, entryId, rankingId, version) => `/labels/${taskId}/${runtimeId}/${entryId}${version ? `@${version}` : ''}.${rankingId}.svg`,
}

function chip(rankingId, grade, text) {
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
const gradedCell = (grade, html, extra = '') => grade?.class
  ? `<td data-grade="${CLASSES.indexOf(grade.class)}" data-v="${grade.ratio ?? ''}" data-value="${grade.value ?? ''}"${extra}>${html}</td>`
  : cell(null, html)
// A type-check cost: the time and memory added, and the class of their product.
// The type-check score's unit, shown once in the legend; cells and labels give
// the bare number. Set as real mathematics so the radical covers the whole product. A megabyte-millisecond is exactly a kilobyte-second, so
// the simpler pair is shown; the inputs are still measured in MB and ms.
const ROOT_MB_MS = '<math class="unit"><msqrt><mrow><mi mathvariant="normal">kB</mi><mo>·</mo><mi mathvariant="normal">s</mi></mrow></msqrt></math>'
// A one-line key for the type-check cells, placed under every table that has them.
const TYPE_KEY = `<p class="soft key">Type check: CPU time added, memory added, then the cost in bold. Cost is the square root of the two multiplied, in ${ROOT_MB_MS}; lower is better.</p>`
const typeCost = (cost, grade = cost) => {
  if (!cost) return cell(null, NA)
  const score = grade?.value ?? cost.score ?? cost.value
  // The score and its two ingredients. Elapsed time is not part of the score, so it is a tooltip.
  const figures = ` data-time="${cost.cpuMs ?? ''}" data-memory="${cost.memoryMb ?? ''}" data-score="${score ?? ''}"`
  return gradedCell(grade, `<span class="type-cost" title="${formatNumber(cost.timeMs)} ms elapsed"><span>${formatNumber(cost.cpuMs)} ms</span><span>${formatNumber(cost.memoryMb)} MB</span><span class="type-cost-score">${score === null || score === undefined ? '' : formatNumber(score)}</span><span class="type-cost-grade">${chip('types', grade)}</span></span>`, figures)
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
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M1 3h9l5 5-5 5H1z' fill='%2300a651'/%3E%3C/svg%3E"

// The catalog tree shown beside every page. It stays short as the catalog
// grows: only the category in `context` is opened to its tasks and packages.
function sidebar(model, path, context) {
  const link = (href, text, extra = '') => `<a href="${href}"${href === path ? ' aria-current="page"' : ''}>${esc(text)}${extra}</a>`
  const categories = model.categories
    .map((c) => {
      if (c.id !== context.category) return `<li>${link(urls.category(c.id), c.title)}</li>`
      const packages = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === c.id))
      return `<li>${link(urls.category(c.id), c.title)}<ul>${c.tasks.map((d) => `<li>${link(urls.task(d.task.id), d.task.title)}</li>`).join('')}</ul>
<h3>Packages in ${esc(c.title)}</h3><ul>${packages.map((p) => `<li>${link(urls.package(p), p.title)}</li>`).join('')}</ul></li>`
    })
    .join('')
  const ecosystems = Object.entries(ECOSYSTEMS)
    .map(([id, eco]) => `<li><a href="${urls.ecosystem(id)}"${urls.ecosystem(id) === path ? ' aria-current="page"' : ''}>${inlineIcon(`eco-${id}`)}${esc(eco.title)} <span class="count">${model.packages.filter((p) => p.ecosystem === id).length}</span></a></li>`)
    .join('')
  return `<nav class="side" aria-label="Catalog">
<h2>${link('/categories/', 'Categories')}</h2>
<ul>${categories}</ul>
<h2>${link('/packages/', 'Packages')}</h2>
<ul>${ecosystems}</ul>
<h2>${link('/runtimes/', 'Runtimes')}</h2>
<ul>${model.runtimes.map((rt) => `<li><a href="${urls.runtime(rt.id)}"${urls.runtime(rt.id) === path ? ' aria-current="page"' : ''}>${inlineIcon(rt.id)}${esc(rt.title)}</a></li>`).join('')}</ul>
<details><summary>Not measured yet <span class="count">${model.index.planned.length}</span></summary>
<ul class="planned">${model.index.planned.map((c) => `<li><a href="/categories/#${esc(c.id)}">${esc(c.title)} <span class="count">${c.packages}</span></a></li>`).join('')}</ul></details>
</nav>`
}

// A table's explanatory text is written as its <caption>, but shown beneath
// the table and outside the sideways scroll, so it stays put and readable.
const captionsBelow = (html) =>
  html.replace(/<div class="scroll">(<table\b[^>]*>)\s*<caption>([\s\S]*?)<\/caption>([\s\S]*?<\/table>)<\/div>/g, '<figure class="tablefig"><div class="scroll">$1$3</div><figcaption>$2</figcaption></figure>')

function layout({ title, description, path, crumbs = [], context = {}, model, body }) {
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
<link rel="icon" href="${ICON}">
${FONTS}
<link rel="stylesheet" href="/styles.css">
<script type="module" src="/app.js"></script>
</head>
<body>
<input type="checkbox" id="menu" class="menu-toggle" aria-label="Show the catalog menu">
<header class="top">
<label for="menu" class="menu-button"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 3h14v2H1zM1 7h14v2H1zM1 11h14v2H1z" fill="currentColor"/></svg>Browse</label>
<a class="name" href="/">Package efficiency labels</a>
<div class="search"><label for="q">Search</label><input id="q" type="search" autocomplete="off" placeholder="Search packages, tasks and categories"><ul id="q-results" hidden></ul></div>
<nav aria-label="Indexes"><a href="/categories/">Categories</a><a href="/tasks/">Tasks</a><a href="/packages/">Packages</a><a href="/runtimes/">Runtimes</a></nav>
</header>
<div class="frame">
${sidebar(model, path, context)}
<div class="content">
${trail}
${body}
<footer>
<p>Edition ${esc(model.index.edition)}, provisional. Measured on one developer laptop, not a reference machine. Every benchmark adapter was written by an AI coding agent and has not been reviewed by a person. Not affiliated with npm, crates.io or any labelling authority. Raw data: <a href="/data/index.json">data/index.json</a>. <a href="/credits/">Credits</a>.</p>
</footer>
</div>
</div>
</body>
</html>
`
}

// --- Shared pieces ----------------------------------------------------------

const byRanking = (rankingId) => (a, b) => a.grades[rankingId].value - b.grades[rankingId].value || a.title.localeCompare(b.title)

// `older` marks an entry from a package's history rather than its latest version.
function card({ entry, data, runtime, rankingId, model, caption, linkPackage = true, older = entry.activeRelease === false }) {
  const svg = renderLabel({ entry, data, runtime, rankingId })
  if (!svg) return ''
  const pkg = model.packageOf(entry)
  const lines = [
    caption && esc(caption),
    linkPackage && `<a href="${urls.package(pkg, entry.version !== pkg.version ? entry.version : null)}">${esc(pkg.title)}, all runtimes</a>`,
    `<a class="soft" href="${urls.label(data.task.id, runtime.id, entry.id, rankingId, older ? entry.version : null)}">SVG</a>`,
  ].filter(Boolean)
  return `<li>${svg}<p class="under">${lines.join(' &nbsp; ')}</p></li>`
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
const orderSwitch = (name) => switcher(name, 'Show', [{ id: 'best', title: 'Best first' }, { id: 'worst', title: 'Worst first' }], 'best')

const languageTitle = id => ({javascript:'JavaScript',python:'Python',ruby:'Ruby',go:'Go',rust:'Rust',all:'All'})[id] ?? id
const languageOf = id => id.startsWith('best-') ? id.slice(5) : ({node:'javascript',bun:'javascript',deno:'javascript',cpython:'python',pypy:'python',ruby:'ruby','ruby-yjit':'ruby',go:'go',rust:'rust'})[id]
function withBestRuntimes(runtimes) {
  return [...runtimes, ...(new Set(runtimes.map(r => languageOf(r.id))).size > 1 ? [{id:'best-all',title:'Best',language:'all',best:true}] : []), ...[...new Set(runtimes.map(r => languageOf(r.id)))].filter(language => runtimes.filter(r => languageOf(r.id) === language).length > 1).map(language => ({id:`best-${language}`,title:'Best',language,best:true,version:''}))]
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
  return `<fieldset class="switch">${languageIcons}<legend>${esc(legend)}</legend>${options
    .map(({ id, title, detail }) => `<input type="radio" name="${name}" id="${name}-${id}" value="${id}"${name === 'runtime' ? ` data-language="${languageOf(id)}"` : ''}${id === checked ? ' checked' : ''}><label for="${name}-${id}">${name === 'runtime' ? inlineIcon(id) : name === 'ranking' || name.startsWith('rank-') ? scaleIcon(id) : ''}${esc(title)}${detail ? `<small>${esc(detail)}</small>` : ''}</label>`)
    .join('')}</fieldset>`
}

// The class boundaries of every ranking, as one table so the scales line up.
function legend(data) {
  const cells = (rankingId, metric, rowspan = 1) =>
    CLASSES.map((letter, i) => {
      const color = classColor(rankingId, letter)
      const unit = metric.absolute ? '' : '×'
      return `<td${rowspan > 1 ? ` rowspan="${rowspan}"` : ''} style="background:${color};color:${inkOn(color)}">${i === 6 ? `over ${metric.scale[5]}${unit}` : `to ${metric.scale[i]}${unit}`}</td>`
    }).join('')
  const typeRows = [
    ...Object.keys(data.compilers).map((id) => [
      `${id} ${esc(data.compilers[id])}`,
      `${id === 'tsgo' ? 'Native Go TypeScript compiler, using the same project and preloaded runtime typings as tsc. CPU includes work across threads; elapsed time is shown separately.' : 'Loads package declarations with Node, Bun and Deno typings in both the baseline and package project. Uses skipLibCheck, so library declaration bodies are not checked.'}${id === data.typesCompiler ? ' Supplies the TypeScript grade.' : ''}`,
      data.typeChecks.typescript,
    ]),
    ...['python', 'ruby', 'go'].filter(id => data.typeChecks[id]).map(id => [data.typeChecks[id].tool, ({python: 'Strictly checks adapter bodies with input/output annotations and Python library stubs; incremental caching is disabled. Runs on CPython, targeting Python 3.12 for both CPython and PyPy.', ruby: 'Checks adapter bodies against method signatures and Ruby interface files (RBI). Routing DSL values and JSON contents remain untyped; this checks the adapter, not the framework internals. Shared by CRuby and YJIT.', go: 'Parses and checks adapter source, including loading library type information. Dependencies are prepared beforehand; compilation, code generation and linking are excluded.'})[id], data.typeChecks[id]]),
    ...(data.typeChecks.cargo ? [['cargo check', 'Re-checks the adapter after dependencies have been checked, relative to an empty program. The adapter is invalidated for each run; cold dependency-check CPU is reported separately.', data.typeChecks.cargo]] : []),
  ]
  const sharedTypeScale = typeRows.every(([, , metric]) => JSON.stringify(metric.scale) === JSON.stringify(typeRows[0][2].scale))
  return `<div class="scroll"><table class="legend">
<thead><tr><th scope="col" colspan="2">Ranking</th><th scope="col" class="l">What is measured</th>${CLASSES.map((letter) => `<th scope="col">${letter}</th>`).join('')}</tr></thead>
<tbody>
<tr><th scope="row" colspan="2">CPU</th><td class="l wrap">${esc(data.metrics.cpu.headline)}: user and system time across all threads. Multiples of the best result.</td>${cells('cpu', data.metrics.cpu)}</tr>
<tr><th scope="row" colspan="2">Memory</th><td class="l wrap">Resident memory after the task and GC, above an empty process of the same runtime. Multiples of the best result.</td>${cells('memory', data.metrics.memory)}</tr>
${typeRows.map(([language, text, metric], i) => `<tr>${i === 0 ? `<th scope="rowgroup" rowspan="${typeRows.length}">Type check</th>` : ''}<th scope="row">${language}</th><td class="l wrap">${text}</td>${!sharedTypeScale ? cells('types', metric) : i === 0 ? cells('types', metric, typeRows.length) : ''}</tr>`).join('\n')}
</tbody></table></div>
<p class="soft">Type-check cost is one number combining time and memory: the square root of added CPU time times added memory, in ${ROOT_MB_MS} (the same as milliseconds times megabytes). In the tables it is the bold figure after the CPU time and memory it is made from. Both are measured relative to the checker's baseline (including shared runtime typings for TypeScript). Every entry is graded against the lowest-cost package in the task, in any language. CPU deltas use a 10 ms floor for noise. TypeScript reports heap memory; the other checkers use peak RSS.</p>`
}

// --- Task page --------------------------------------------------------------

const unitOf = (data) => data.task.kind === 'sync-operation' ? 'operation' : 'request'
const cpuOf = (m) => m.cpuPerOperationUs ?? m.cpuPerRequestUs
const rateOf = (m) => m.operationsPerCpuSecond ?? m.requestsPerCpuSecond

function rankingTable(data, runtime, entries, model) {
  const isRust = runtime.id === 'rust'
  const isNative = ['python', 'ruby', 'go'].includes(runtime.language)
  const isAll = runtime.language === 'all'
  const compilers = (runtime.language ?? 'javascript') === 'javascript' ? Object.keys(data.compilers) : []
  const rows = entries.map((e) => {
    const m = e.metrics
    const growth = e.flags.includes('grows-with-use') ? ` (+${formatNumber(m.leakBytesPerOperation ?? m.leakBytesPerRequest)} B per ${unitOf(data)})` : ''
    const typeCells = isRust
      ? typeCost(e.types, e.grades.types) + cell(e.types?.coldCpuS, num(e.types?.coldCpuS, ' s'))
      : isAll ? typeCost(e.types?.compilers?.[data.typesCompiler] ?? e.types, e.grades.types) : isNative ? typeCost(e.types, e.grades.types) : compilers.map((id) => typeCost(e.types?.compilers[id])).join('')
    return `<tr><td><a href="${urls.package(model.packageOf(e))}">${esc(e.title)}</a><span class="ver">${e.builtin ? 'built in' : esc(e.version ?? '')}</span></td>
${isAll ? `<td class="l">${esc(languageTitle(languageOf(e.selectedRuntime.id)))}</td>` : ''}
${runtime.best ? `<td class="l">${inlineIcon(e.selectedRuntime.id)}${esc(e.selectedRuntime.title)}</td>` : ''}
${gradedCell(e.grades.cpu, `${num(cpuOf(m), ' µs')}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `<span class="memory-cost"><span>${num(m.memoryMb, ' MB')}</span><span class="memory-cost-grade">${chip('memory', e.grades.memory)}</span><span class="memory-cost-detail">${num(m.settledRssMb, ' MB')} total after GC</span><span class="memory-cost-detail">${num(m.peakRssMb, ' MB')} lifetime peak</span></span>`)}
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
<caption>${runtime.best ? 'Best runtime per package for the selected ranking, across the selected language(s). Other figures come from that same runtime. Package memory is above its own settled baseline; total RSS is shown below.' : `All figures for ${esc(runtime.title)} ${esc(runtime.version)}. Package memory grades use RSS after the final task round and GC, above an empty ${esc(runtime.title)} process (${runtime.baselineMb} MB). Total after-task RSS and the ungraded lifetime peak are shown underneath. Runtime comparison labels grade total after-task RSS. RSS includes JIT code and allocator memory still held after GC; it is not live heap size or peak task demand. ${data.task.kind === 'sync-operation' ? 'Throughput is batch wall-clock speed; per-operation latency is not measured.' : 'Throughput and latency depend on the load generator and are not graded.'} Heap over baseline uses the runtime's own accounting (${num(runtime.baselineHeapKb, ' KB')} baseline): ${esc(runtime.heapDescription)} These heap figures are not comparable across engines.`}</caption>
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
    const holder = anchor ? ` Class A is set by the lowest-cost package in this task in any language (built-ins add nothing and are not counted): ${esc(anchor.title)}${anchor.version ? ` ${esc(anchor.version)}` : ''}, checked with ${esc(anchor.tool)}, at ${formatNumber(anchor.value)}.` : ''
    const how = runtime.language === 'all'
      ? 'Each language is checked with its own tool, and the tools do different amounts of work, so this compares what type checking costs in each ecosystem, not which checker is better.'
      : `Measured with ${esc(metric.tool)}${metric.notes ? `: ${esc(metric.notes)}` : '.'}`
    return `<p class="note">Type-check cost is the square root of the CPU time and memory the checker adds, with a 10 ms CPU floor for noise.${holder} ${how}</p>`
  }
  const { anchor } = metric
  const best = entries[0]
  const holder = `${esc(anchor.title)}${anchor.version ? ` ${esc(anchor.version)}` : ''} on ${esc(anchor.runtime)}`
  const times = Math.max(best.grades[rankingId].value, metric.floor) / anchor.value
  const gap = times < 1.05 ? `${esc(runtime.title)} matches it.` : `The best on ${esc(runtime.title)}, ${esc(best.title)}, uses ${formatNumber(times)} times as much.`
  return `<p class="note">Class A is set by the best result in any language: ${holder}, at ${formatNumber(anchor.value)} ${esc(metric.headline)}. ${gap}</p>`
}

function explorer(data, model) {
  const rankings = Object.keys(RANKINGS)
  const panels = []
  const rules = []
  const runtimes = withBestRuntimes(data.runtimes)
  for (const runtime of runtimes) {
    for (const rankingId of rankings) {
      const entries = runtime.best ? bestTaskEntries(data.runtimes,runtime.language,rankingId) : runtime.entries.filter((e) => e.grades[rankingId]).sort(byRanking(rankingId))
      rules.push(`.explorer:has(#runtime-${runtime.id}:checked):has(#ranking-${rankingId}:checked) .panel[data-runtime="${runtime.id}"][data-ranking="${rankingId}"]`)
      const content = entries.length
        ? `${anchorNote(data, runtime, rankingId, entries)}
${shelf(entries.map((entry) => card({ entry, data, runtime: entry.selectedRuntime ?? runtime, rankingId, model })))}
${rankingTable(data, runtime, entries, model)}`
        : `<p class="note">There are no ${esc(RANKINGS[rankingId].title.toLowerCase())} figures for ${esc(runtime.title)}.</p>`
      panels.push(`<section class="panel" data-runtime="${runtime.id}" data-ranking="${rankingId}" aria-label="${esc(RANKINGS[rankingId].title)} ranking on ${esc(runtime.title)}">
${content}
</section>`)
    }
  }
  return `<div class="explorer">
<style>${rules.join(',')}{display:block}</style>
<div class="switches">
${switcher('runtime', 'Runtime', runtimes.map((r) => ({ id: r.id, title: r.title, detail: r.version })), data.reference)}
${switcher('ranking', 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}
${orderSwitch('order')}
</div>
${panels.join('\n')}
</div>`
}

export function taskPage(data, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const authors = new Set(data.runtimes.flatMap((r) => r.entries.map((e) => `${e.adapter.author.agent ?? e.adapter.author.kind} (${e.adapter.author.model ?? 'no model recorded'})`)))
  const load = data.task.load
  return layout({
    title: `${data.task.title}: package efficiency labels`,
    description: data.task.summary,
    path: urls.task(data.task.id),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], [category.title, urls.category(category.id)], [data.task.title]],
    model,
    body: `<main>
<h1>${esc(data.task.title)}</h1>
<p class="intro">${esc(data.task.summary)} Every entry is graded against the most efficient implementation in any language or runtime, so a class means the same on every tab.</p>
${explorer(data, model)}

<h2>Runtimes compared on this task</h2>
${runtimeSection([data], model, data.task.title)}

<h2>Reading a label</h2>
${legend(data)}
<p>${data.task.kind === "http-server" ? "CPU steps are narrow because these servers sit close together; anything finer would be smaller than the run-to-run variation. " : "CPU classes use multiples of the best measured operation cost. "}Import time is shown on labels but not graded.</p>

<h2>How this was measured</h2>
<ul>
${data.task.kind === 'sync-operation' ? `<li>${esc(data.task.summary)} Fixtures include ${data.task.fixtureCount ?? 0} cases. Every case is checked before timing.</li>
<li>An initial ${load.warmup.toLocaleString('en-US')} operations, then one full ${load.rounds}-round unmeasured warm-up run in the same process, followed by ${load.rounds} measured rounds. Each round runs batches of ${load.operationsPerRound.toLocaleString('en-US')} operations for at least ${load.minRoundMs} ms. Figures are medians across rounds, then process runs; this task uses ${[...new Set(data.runtimes.flatMap((r) => r.entries.map((e) => e.measurement.runs)))].join(', ')} runs per entry.</li>
<li>CPU is measured inside the child process. Fixture construction, correctness checks, IPC and forced garbage collection are outside timing. Each result contributes to an observable checksum.</li>` : `<li>${load.workers * load.connections} keep-alive connections send equal thirds of three requests: a plain-text route, a JSON route with a parameter, and a JSON POST.</li>
<li>An initial ${load.warmup.toLocaleString('en-US')} requests, then a full ${load.rounds}-round unmeasured warm-up run in the same process, followed by ${load.rounds} measured rounds of ${load.requestsPerRound.toLocaleString('en-US')}. Each figure is the median of the rounds, then of three separate process runs.</li>
<li>Every response is checked against the expected status, content type and body before anything is measured.</li>`}
<li>Garbage-collected runtimes are asked to collect after each round. Rust drops temporary allocations normally and reports live and peak allocation counts. Heap that keeps growing from round to round is flagged on the label.</li>
${data.task.notes ? `<li>${esc(data.task.notes)}</li>` : ""}
<li>An entry is listed on a runtime only if it runs there.</li>
${data.task.kind === "http-server" ? "<li>Rust and Go servers use every core by default and the JavaScript servers use one, which is why throughput is not graded. Their one-thread variants are listed beside them.</li><li>An entry named for a package runs it as installed. A tuned variant changes one setting from a fixed list (worker threads, or one application thread) and says which in its name.</li>" : ""}
<li>Machine: ${esc(data.machine.cpu)}, ${data.machine.cores} cores, ${esc(data.machine.os)}.</li>
<li>Adapters written by ${esc([...authors].join(', '))}. None reviewed by a person or by the package's maintainers.</li>
<li>All of it can be read: <a href="${urls.source(data.task.id)}">the task and its scenario</a>, each entry's adapter from the Benchmark column above, and the <a href="${repoUrl(model, 'tree', 'harness')}">measuring harness</a> on GitHub.</li>
</ul>
</main>`,
  })
}

// --- Package page -----------------------------------------------------------

function typeDetail(data, entry) {
  if (entry.types.metricKey) return `<p>Measured with ${esc(entry.types.tool)} ${esc(entry.types.version)}: ${esc(entry.types.notes)} Eleven fresh-process runs per workload and baseline. Adds ${formatNumber(entry.types.cpuMs)} ms CPU, ${formatNumber(entry.types.timeMs)} ms elapsed, and ${formatNumber(entry.types.memoryMb)} MB peak RSS. Negative baseline deltas are clamped to zero; scores use a 10 ms CPU floor and a minimum anchor of 1.</p>`
  if (entry.types.tool === 'cargo') {
    return `<p>Measured with ${esc(data.typeChecks.cargo.tool)}. A first check of the crate and its dependencies takes ${formatNumber(entry.types.coldCpuS)} s of CPU. Re-checking the adapter afterwards adds ${formatNumber(entry.types.cpuMs)} ms CPU, ${formatNumber(entry.types.timeMs)} ms elapsed and ${formatNumber(entry.types.memoryMb)} MB over an empty program.</p>`
  }
  const rows = Object.entries(entry.types.compilers)
    .filter(([, c]) => c)
    .map(([id, c]) => `<tr><td>${id} ${esc(data.compilers[id])}</td>${cell(c.cpuMs, `${formatNumber(c.cpuMs)} ms CPU`)}${cell(c.timeMs, `${formatNumber(c.timeMs)} ms`)}${cell(c.memoryMb, `${formatNumber(c.memoryMb)} MB`)}${cell(c.score, `${formatNumber(c.score)}${chip('types', c)}`)}${cell(c.symbols, c.symbols.toLocaleString('en-US'))}${cell(c.files, c.files)}</tr>`)
  return `<div class="scroll"><table class="narrow sortable">
<caption>Types come from ${esc(entry.types.from === 'bundled' ? 'the package itself' : entry.types.from)}. Both compilers are graded against the lowest-cost package in the task, in any language.</caption>
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
  return `<h3>Versions</h3>
<div class="scroll"><table class="sortable">
<caption>Every measured version, on the same scale. Rankings use active full releases; the default is ${esc(pkg.version)}.</caption>
<thead><tr><th scope="col">Version</th><th scope="col" class="l">Runtime</th>${[`CPU per ${unitOf(data)}`, 'Memory', 'Heap retained after load', 'Import time'].map((t) => sortable(t)).join('')}</tr></thead>
<tbody>${all
    .map(({ runtime, entry: e, ranked }) => `<tr${e.version === viewing ? ' class="here"' : ''}><td><a href="${urls.package(pkg, e.version===pkg.version ? null : e.version)}">${esc(e.version)}</a>${ranked ? '<span class="ver">ranked</span>' : ''}</td><td class="l">${inlineIcon(runtime.id)}${esc(runtime.title)}</td>
${gradedCell(e.grades.cpu, `${num(cpuOf(e.metrics), ' µs')}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `${num(e.metrics.memoryMb, ' MB')}${chip('memory', e.grades.memory)}`)}
${cell(e.metrics.retainedKb, num(e.metrics.retainedKb, ' KB'))}
${cell(e.metrics.importMs, num(e.metrics.importMs, ' ms'))}</tr>`)
    .join('\n')}</tbody></table></div>`
}

// All measured versions of a package, newest first.
export const versionsOf = (pkg) =>
  [...new Set([pkg.version, ...pkg.appearances.map(a=>a.entry.version), ...pkg.history.map((a) => a.entry.version)].filter(Boolean))].sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))

// `version` selects an earlier version; without it the page is for the latest.
export function packagePage(pkg, model, version = pkg.version) {
  const eco = ECOSYSTEMS[pkg.ecosystem]
  const older = version !== pkg.version
  const shown = [...pkg.appearances,...pkg.history].filter(a=>a.entry.version===version)
  const failures = model.tasks.flatMap(data=>data.runtimes.flatMap(runtime=>(runtime.unsupported??[]).filter(e=>e.ecosystem===pkg.ecosystem&&e.package===pkg.name&&e.version===version).map(entry=>({runtime,entry}))))
  const versions = versionsOf(pkg)
  const versionNav =
    versions.length > 1
      ? `<nav class="versions" aria-label="Versions"><b>Version</b>${versions.map((v) => `<a href="${urls.package(pkg, v === pkg.version ? null : v)}"${v === version ? ' aria-current="page"' : ''}>${esc(v)}${v === pkg.version ? '<small>default</small>' : pkg.appearances.some(a=>a.entry.version===v) ? '<small>active</small>' : ''}</a>`).join('')}</nav>`
      : ''
  const sections = model.tasks
    .map((data) => {
      const rows = shown.filter((a) => a.data === data)
      if (rows.length === 0) return ''
      const perRanking = ['cpu', 'memory']
        .map((rankingId) => {
          const cards = rows.map(({ runtime, entry }) => card({ entry, data, runtime, rankingId, model, caption: runtime.title, linkPackage: false, older: !entry.activeRelease }))
          return `<h3>${esc(RANKINGS[rankingId].title)}</h3>${shelf(cards, { limit: Infinity })}`
        })
        .join('\n')
      // The type-check figure does not depend on the runtime, so show each adapter's once.
      const typed = [...new Map(rows.filter((a) => a.entry.grades.types).map((a) => [a.entry.id, a])).values()].slice(0, 1)
      const typeSection = typed
        .map(({ entry, runtime }) => `<h3>Type check</h3>${shelf([card({ entry, data, runtime, rankingId: 'types', model, linkPackage: false })])}${typeDetail(data, entry)}`)
        .join('')
      const table = `<div class="scroll"><table class="sortable">
<caption>${esc(pkg.title)} in ${esc(data.task.title)}, on every runtime where it runs.</caption>
<thead><tr><th scope="col">Runtime</th><th scope="col" class="l">Entry</th>${[`CPU per ${unitOf(data)}`, 'Memory', 'Heap retained after load', 'Import time', `${unitOf(data)}s per CPU-second`, 'Latency, p99'].map((t) => sortable(t)).join('')}</tr></thead>
<tbody>${rows
        .map(({ runtime, entry: e }) => `<tr><td>${esc(runtime.title)}<span class="ver">${esc(runtime.version)}</span></td><td class="l">${esc(e.title)}</td>
${gradedCell(e.grades.cpu, `${num(cpuOf(e.metrics), ' µs')}${chip('cpu', e.grades.cpu)}`)}
${gradedCell(e.grades.memory, `${num(e.metrics.memoryMb, ' MB')}${chip('memory', e.grades.memory)}`)}
${cell(e.metrics.retainedKb, num(e.metrics.retainedKb, ' KB'))}
${cell(e.metrics.importMs, num(e.metrics.importMs, ' ms'))}
${cell(rateOf(e.metrics), num(rateOf(e.metrics)))}
${cell(e.metrics.latencyP99Ms, num(e.metrics.latencyP99Ms, ' ms'))}</tr>`)
        .join('\n')}</tbody></table></div>`

      const adapters = [...new Map(rows.map((a) => [a.entry.id, a.entry])).values()]
      const adapterList = adapters
        .map((e) => {
          const a = e.adapter
          const who = a.author.kind === 'human' ? 'a person' : `${a.author.agent} (${a.author.model})`
          const reviewed = a.review === 'unreviewed' ? 'not reviewed by a person' : `reviewed by ${a.review === 'maintainer' ? "the package's maintainers" : 'a person'}`
          const runtimeNotes = [...new Map(rows.filter((row) => row.entry.id === e.id).map((row) => [row.runtime.id, row.runtime])).values()]
            .filter((runtime) => a.runtimeNotes?.[runtime.id])
            .map((runtime) => `${esc(runtime.title)}: ${esc(a.runtimeNotes[runtime.id])}`)
            .join(' ')
          return `<li>${esc(e.title)}: written by ${esc(who)} on ${esc(a.author.date)}, ${reviewed}.${a.dependencies.length ? ` Measured with ${esc(a.dependencies.join(', '))}.` : ''}${a.notes ? ` ${esc(a.notes)}` : ''}${runtimeNotes ? ` ${runtimeNotes}` : ''} <a href="${urls.source(data.task.id, adapterIdOf(e))}">Source code</a></li>`
        })
        .join('')
      return `<section>
<h2><a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a></h2>
${table}
${versionHistory(pkg, data, version)}
${perRanking}
${typeSection}
<h3>Benchmark adapters</h3>
<ul>${adapterList}</ul>
</section>`
    })
    .join('\n')

  const runsOn = [...new Set(shown.map((a) => a.runtime.title))]
  const status = older ? (pkg.appearances.some(a=>a.entry.version===version) ? `An active release line; the default is ${esc(pkg.version)}.` : `A version-history result, outside the rankings. The default full release is ${esc(pkg.version)}.`) : versions.length > 1 ? 'The default full release used for rankings.' : ''
  return layout({
    title: `${pkg.title}${version ? ` ${version}` : ''}: package efficiency labels`,
    description: `Efficiency labels for ${pkg.title}${version ? ` ${version}` : ''} on ${runsOn.join(', ')}.`,
    // Earlier versions keep the package highlighted in the catalog tree.
    path: urls.package(pkg),
    context: { category: pkg.appearances[0].data.task.category },
    crumbs: [['Packages', '/packages/'], [eco.title, urls.ecosystem(pkg.ecosystem)], ...(older ? [[pkg.title, urls.package(pkg)], [version]] : [[pkg.title]])],
    model,
    body: `<main>
<h1>${esc(pkg.title)}${version ? ` <span class="ver">${esc(version)}</span>` : ''}</h1>
<p class="intro">${pkg.ecosystem === 'builtin' ? 'Built into its runtime' : `${esc(eco.title)} package`}. Measured on ${esc(runsOn.join(', '))} in ${plural(new Set(shown.map((a) => a.data)).size, 'task')}. ${status}${eco.registry ? ` <a href="${eco.registry(pkg.name)}">View on the registry</a>.` : ''}</p>
${versionNav}
${failures.length ? `<section class="compatibility" aria-label="Benchmark compatibility">${failures.map(({runtime,entry})=>`<div class="compatibility-item"><p><strong>${esc(runtime.title)} unavailable.</strong> ${esc(entry.notes ?? 'This package version could not complete the benchmark on this runtime.')}</p><details><summary>Details</summary><pre>${esc(entry.error)}</pre></details></div>`).join('')}</section>` : ''}
${sections}
</main>`,
  })
}

// --- Lists ------------------------------------------------------------------

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
    return { grade: entry.grades[rankingId], text: text(entry), tuned: variant && variant.grades[rankingId].value < entry.grades[rankingId].value ? { grade: variant.grades[rankingId], text: text(variant), title: variant.title } : null }
  }
  const mean = Math.round(hits.reduce((sum, a) => sum + CLASSES.indexOf(a.entry.grades[rankingId].class), 0) / hits.length)
  return { grade: { class: CLASSES[mean], value: mean, ratio: hits.reduce((sum, a) => sum + a.entry.grades[rankingId].ratio, 0) / hits.length }, text: `${hits.length} tasks` }
}

// One row per package, for one runtime at a time. Mixing runtimes in one
// table leaves most cells empty as languages are added.
function packageTable(packages, model, { showEcosystem }) {
  packages = activeReleaseRows(packages)
  const actualRuntimes = model.runtimes.filter((rt) => packages.some((p) => p.appearances.some((a) => a.runtime.id === rt.id)))
  const runtimes = withBestRuntimes(actualRuntimes)
  if (runtimes.length === 0) return ''
  const reference = model.tasks[0].reference
  const checked = (runtimes.find((rt) => rt.id === reference) ?? runtimes[0]).id

  const panels = runtimes.map((rt) => {
    const rows = packages.filter((p) => p.appearances.some((a) => rt.best ? (rt.language === 'all' || languageOf(a.runtime.id) === rt.language) : a.runtime.id === rt.id))
    const isRust = rt.id === 'rust'
    const nativeLanguage = ['python','ruby','go'].includes(languageOf(rt.id)) ? languageOf(rt.id) : null
    const compilers = languageOf(rt.id) === 'javascript' ? Object.keys(model.index.compilers) : []
    const metricCell = (pkg, rankingId, selectedId) => {
      const hit = packageGrade(pkg, selectedId, rankingId)
      if (!hit) return cell(null, NA)
      const asInstalled = `${esc(hit.text)}${chip(rankingId, hit.grade)}`
      if (!hit.tuned) return gradedCell(hit.grade, asInstalled)
      // Both figures are in the cell; the Settings switch shows one of them,
      // and the script swaps which one the column sorts by.
      const tuned = hit.tuned.grade
      return `<td data-grade="${CLASSES.indexOf(hit.grade.class)}" data-v="${hit.grade.ratio ?? ''}" data-value="${hit.grade.value ?? ''}" data-tuned-grade="${CLASSES.indexOf(tuned.class)}" data-tuned-v="${tuned.ratio ?? ''}" data-tuned-value="${tuned.value ?? ''}"><span class="as-installed">${asInstalled}</span><span class="as-tuned" title="${esc(hit.tuned.title)}">${WRENCH}${esc(hit.tuned.text)}${chip(rankingId, tuned)}</span></td>`
    }
    const body = rows.map((pkg) => {
      const candidates = rt.best ? actualRuntimes.filter(r => (rt.language === 'all' || languageOf(r.id) === rt.language) && packageGrade(pkg,r.id,'cpu')) : [rt]
      const coverage = r => new Set(pkg.appearances.filter(a => a.runtime.id === r.id).map(a => a.data.task.id)).size
      const selected = candidates.sort((a,b) => coverage(b)-coverage(a) || CLASSES.indexOf(packageGrade(pkg,a.id,'cpu').grade.class)-CLASSES.indexOf(packageGrade(pkg,b.id,'cpu').grade.class) || packageGrade(pkg,a.id,'cpu').grade.ratio-packageGrade(pkg,b.id,'cpu').grade.ratio)[0]
      const here = pkg.appearances.filter((a) => a.runtime.id === selected.id)
      const typed = here.find((a) => a.entry.types)?.entry
      const typeCells = isRust
        ? typeCost(typed?.types, typed?.grades.types) + cell(typed?.types?.coldCpuS, num(typed?.types?.coldCpuS, ' s'))
        : rt.language === 'all' ? typeCost(typed?.types?.compilers?.[model.tasks[0].typesCompiler] ?? typed?.types, typed?.grades.types) : nativeLanguage ? typeCost(typed?.types, typed?.grades.types) : compilers.map((id) => typeCost(typed?.types.compilers[id])).join('')
      return `<tr><td><a href="${urls.package(pkg,pkg.version===pkg.defaultVersion?null:pkg.version)}">${esc(pkg.title)}</a><span class="ver">${esc(pkg.version ?? '')}</span></td>
${metricCell(pkg, 'cpu', selected.id)}${metricCell(pkg, 'memory', selected.id)}${typeCells}
<td>${new Set(here.map((a) => a.data)).size}</td>
${rt.best ? `<td class="l">${inlineIcon(selected.id)}${esc(selected.title)}</td>` : ''}${rt.language === 'all' ? `<td class="l">${esc(languageTitle(languageOf(selected.id)))}</td>` : ''}
<td class="l categories">${[...new Set(here.map(a => a.data.task.category))].map(id => `<a href="${urls.category(id)}">${esc(model.categories.find(c => c.id === id).title)}</a>`).join(', ')}</td>
${showEcosystem ? `<td class="l">${inlineIcon(`eco-${pkg.ecosystem}`)}<a href="${urls.ecosystem(pkg.ecosystem)}">${esc(ECOSYSTEMS[pkg.ecosystem].title)}</a></td>` : ''}</tr>`
    })
    const typeHeads = isRust ? sortableTypes('cargo check') + sortable('cargo check, first run, CPU') : rt.language === 'all' ? sortableTypes('Type check') : nativeLanguage ? sortableTypes(`Type check, ${({python: 'mypy', ruby: 'Sorbet', go: 'go/types'})[nativeLanguage]}`) : compilers.map((id) => sortableTypes(`Type check, ${id} ${esc(model.index.compilers[id])}`)).join('')
    return `<section class="panel" data-runtime="${rt.id}"${runtimes.length === 1 ? ' style="display:block"' : ''} aria-label="Packages on ${esc(rt.title)}">
<div class="scroll"><table class="sortable">
<caption>${plural(rows.length, 'release')} on ${esc(rt.title)} ${esc(rt.version)}. ${rt.best ? 'Best chooses the lowest CPU grade and relative cost per package, among runtimes with the greatest measured task coverage. All figures in a row use that runtime. ' : ''}Rated columns sort by label first, then by value; press a heading again to step through the orders.</caption>
<thead><tr><th scope="col">Package</th>${sortableGraded('CPU')}${sortableGraded('Memory')}${typeHeads}${sortable('Tasks')}${rt.best ? sortable('Runtime', ' class="l"') : ''}${rt.language === 'all' ? sortable('Language', ' class="l"') : ''}${sortable('Categories', ' class="l"')}${showEcosystem ? '<th scope="col" class="l">Ecosystem</th>' : ''}</tr></thead>
<tbody>${body.join('\n')}</tbody></table></div>
${TYPE_KEY}
</section>`
  })
  const hasTuned = packages.some((p) => p.appearances.some((a) => a.entry.name !== a.entry.package))
  if (runtimes.length === 1 && !hasTuned) return panels[0]
  const rules = runtimes.map((rt) => `.pick:has(#runtime-${rt.id}:checked) .panel[data-runtime="${rt.id}"]`)
  const settings = hasTuned
    ? switcher('settings', 'Settings', [{ id: 'tuned', title: 'Tuned' }, { id: 'installed', title: 'As installed' }], 'tuned')
    : ''
  return `<div class="pick">
<style>${rules.join(',')}{display:block}</style>
<div class="switches">${runtimes.length > 1 ? switcher('runtime', 'Runtime', runtimes.map((rt) => ({ id: rt.id, title: rt.title, detail: rt.version })), checked) : ''}${settings}</div>
${panels.join('\n')}
</div>`
}

export function packagesPage(model) {
  return layout({
    title: 'Packages: package efficiency labels',
    description: 'Every measured package, with its classes on each runtime.',
    path: '/packages/',
    crumbs: [['Packages']],
    model,
    body: `<main>
<h1>Packages</h1>
<p class="intro">${plural(model.packages.length, 'package')} measured. Pick a runtime to see what runs on it. Active release lines have separate rows. Within each release, the best variant is shown.</p>
${packageTable(model.packages, model, { showEcosystem: true })}
</main>`,
  })
}

export function ecosystemPage(id, model) {
  const eco = ECOSYSTEMS[id]
  const packages = model.packages.filter((p) => p.ecosystem === id)
  const intro = {
    npm: 'Packages from the npm registry, measured on each JavaScript runtime where they run.',
    cargo: 'Rust crates. They share tasks with the npm packages, so their results set the top of the scale where they are the most efficient.',
    jsr: 'Packages from their official JSR distribution, measured across compatible runtimes. The npm-compatible bridge is an installation mechanism, not a second package entry.',
    builtin: 'What each runtime ships with. These show the cost of using no package at all.',
  }[id]
  return layout({
    title: `${eco.title}: package efficiency labels`,
    description: intro,
    path: urls.ecosystem(id),
    crumbs: [['Packages', '/packages/'], [eco.title]],
    model,
    body: `<main>
<h1>${esc(eco.title)}</h1>
<p class="intro">${esc(intro)}</p>
${packages.length ? packageTable(packages, model, { showEcosystem: false }) : '<p class="note">Nothing measured in this ecosystem yet.</p>'}
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
    title: 'Tasks: package efficiency labels',
    description: 'Every benchmark task, grouped by category.',
    path: '/tasks/',
    crumbs: [['Tasks']],
    model,
    body: `<main>
<h1>Tasks</h1>
<p class="intro">A task is one job that every package in a category can do, run the same way for all of them.</p>
${model.categories.map((c) => `<h2><a href="${urls.category(c.id)}">${esc(c.title)}</a></h2>${taskRows(c.tasks)}`).join('\n')}
</main>`,
  })
}

export function categoryPage(category, model) {
  const packages = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === category.id))
  return layout({
    title: `${category.title}: package efficiency labels`,
    description: category.summary,
    path: urls.category(category.id),
    context: { category: category.id },
    crumbs: [['Categories', '/categories/'], [category.title]],
    model,
    body: `<main>
<h1>${categoryIcon(category.id, 48)}${esc(category.title)}</h1>
<p class="intro">${esc(category.summary)}</p>
<h2>Tasks</h2>
${taskRows(category.tasks)}
<h2>Runtimes compared</h2>
${runtimeSection(category.tasks, model, category.title)}
<h2>Packages</h2>
${packageTable(packages, model, { showEcosystem: true })}
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
// Sizes are whole fractions of the 96-unit drawing grid (48 is half, 24 a
// quarter), so lines land on whole pixels.
const categoryIcon = (id, size = 48) =>
  `<svg class="cat" viewBox="0 0 96 96" width="${size}" height="${size}" aria-hidden="true">${CATEGORY_ART[id] ?? CATEGORY_ART._default}</svg>`

function categoryTiles(model) {
  return `<ul class="tiles">${model.categories
    .map((c) => {
      const packages = model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === c.id))
      return `<li><a href="${urls.category(c.id)}">${categoryIcon(c.id)}<span><b>${esc(c.title)}</b><small>${plural(c.tasks.length, 'task')}, ${plural(packages.length, 'package')}</small></span></a></li>`
    })
    .join('')}</ul>`
}

function plannedTable(model) {
  return `<div class="scroll"><table class="sortable" id="planned">
<thead><tr><th scope="col">Category</th>${sortable('Packages in the top 1,000')}<th scope="col" class="l">Candidate task</th></tr></thead>
<tbody>${model.index.planned.map((c) => `<tr id="${esc(c.id)}"><td>${categoryIcon(c.id, 24)}${esc(c.title)}</td>${cell(c.packages, c.packages)}<td class="l wrap">${esc(c.benchmarkIdea ?? '')}</td></tr>`).join('\n')}</tbody>
</table></div>`
}

export function categoriesPage(model) {
  return layout({
    title: 'Categories: package efficiency labels',
    description: 'Categories of packages that do the same job, measured and planned.',
    path: '/categories/',
    crumbs: [['Categories']],
    model,
    body: `<main>
<h1>Categories</h1>
<p class="intro">A category groups packages that can do the same job, so they can run the same task and be compared.</p>
<h2>Measured</h2>
${categoryTiles(model)}
<h2>Not measured yet</h2>
<p>${plural(model.index.planned.length, 'category')} found among the 1,000 most downloaded npm packages, each with a candidate task.</p>
${plannedTable(model)}
</main>`,
  })
}

export function homePage(model) {
  const lead = model.tasks[0]
  return layout({
    title: 'Package efficiency labels',
    description: 'Energy-label style efficiency classes for packages: CPU, memory and type-check cost, measured per task across runtimes.',
    path: '/',
    model,
    body: `<main>
<h1>Package efficiency labels</h1>
<p class="intro">Packages that do the same job run the same task. Each gets a class from A to G for CPU, memory and type-check cost, like the label on a fridge.</p>
<h2>Categories</h2>
${categoryTiles(model)}
<h2>Packages</h2>
${packageTable(model.packages, model, { showEcosystem: true })}
<h2>Reading a label</h2>
${legend(lead)}
<p>Class A is set by the best result for the task in any language or runtime, so a class means the same thing everywhere. A runtime's own built-in counts as an entry, so a package can be compared with using nothing at all.</p>
<h2>Not measured yet</h2>
<p>${plural(model.index.planned.length, 'category')} from the 1,000 most downloaded npm packages. <a href="/categories/#planned">See the candidate task for each</a>.</p>
<ul class="tiles plain">${model.index.planned.map((c) => `<li><a href="/categories/#${esc(c.id)}">${categoryIcon(c.id, 48)}<span><b>${esc(c.title)}</b><small>${plural(c.packages, 'package')}</small></span></a></li>`).join('')}</ul>
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
const TYPE_RUNTIME_SCALE = [1.5, 3, 6, 12, 25, 50]
const typeScore = (e) => (e.grades.types?.value == null ? null : Math.max(e.grades.types.value, 1))
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
          const entries = data.runtimes.find((r) => r.id === rt.id)?.entries ?? []
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
function runtimeCards(tasks, model, scope, rankingId, only) {
  const cards = runtimeScores(tasks, model)
    .filter((s) => s[rankingId] && (!only || s.runtime.id === only))
    .sort((a, b) => CLASSES.indexOf(a[rankingId].best.class) - CLASSES.indexOf(b[rankingId].best.class) || a[rankingId].best.ratio - b[rankingId].best.ratio || a[rankingId].typical.ratio - b[rankingId].typical.ratio)
    .map((s) => {
      const grade = (id, pick) => ({ class: s[id][pick].class, value: s[id][pick].ratio })
      const entry = {
        title: s.runtime.title,
        grades: { cpu: grade('cpu', 'best'), memory: grade('memory', 'best'), ...(s.types ? { types: grade('types', 'best') } : {}) },
        types: { icon: s.runtime.id },
        typeCaption: 'times the best type-check cost',
        metrics: { importMs: null },
        adapter: { notes: `Memory is total RSS after the task and GC, including the runtime and retained allocator memory. ${tasks.length > 1 ? `Geometric mean of the best result in each measured task. Covers ${s.tasks} of ${tasks.length} tasks; missing tasks are excluded.` : ''}` },
        flags: [],
      }
      const data = {
        metrics: { cpu: { unit: '×', headline: 'times the best CPU result' }, memory: { unit: '×', headline: 'times the best after-task memory' } },
        typeChecks: { typescript: { unit: '×', headline: 'times the best type-check cost' } },
      }
      const svg = renderLabel({ entry, data, runtime: s.runtime, rankingId, subtitle: `Version ${s.runtime.version}`, context: `${scope}, best across ${plural(s.tasks, 'task')}` })
      const typical = s[rankingId].typical
      return `<li>${svg}<p class="under"><a href="${urls.runtime(s.runtime.id)}">${esc(s.runtime.title)}, all tasks</a><br><span class="nowrap">Typical entry ${formatNumber(typical.ratio)}×${chip(rankingId, typical)}</span></p></li>`
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
  const rules = rankings.map((id) => `.ranked:has(#${rank}-${id}:checked) .ranked-panel[data-ranking="${id}"]`)
  return `<div class="ranked">
<style>${rules.join(',')}{display:block}</style>
<div class="switches">${switcher(rank, 'Rank by', rankings.map((id) => ({ id, title: RANKINGS[id].title })), 'cpu')}${orderSwitch(`order-${key}`)}</div>
${rankings.map((id) => `<div class="ranked-panel" data-ranking="${id}">${runtimeCards(tasks, model, scope, id)}</div>`).join('\n')}
${runtimeTable(tasks, model, highlight)}
</div>`
}

function runtimeTable(tasks, model, highlight) {
  const scores = runtimeScores(tasks, model)
  if (scores.length === 0) return ''
  const figure = (rankingId, grade) => gradedCell(grade, `${formatNumber(grade.ratio)}×${chip(rankingId, grade)}`)
  return `<div class="scroll"><table class="sortable">
<caption>Multiples of the best result in any language. Runtime memory uses total RSS after the task and GC; package memory labels use the amount above the settled empty-process baseline. Best combines the most efficient entry in each measured task using a geometric mean. Missing tasks are excluded; coverage is shown separately. Type check compares the cost scores of the packages on each runtime, across different checkers (TypeScript, mypy, Sorbet, Go's checker, cargo check), so it shows what type checking costs in each ecosystem rather than which checker is better; built-ins are left out where a runtime has packages. Typical is the geometric mean over every entry on that runtime, including non-default variants and other runtimes' APIs run through compatibility layers.</caption>
<thead><tr><th scope="col">Runtime or language</th>${sortable('Entries')}${sortable('Tasks')}${sortable('CPU, best')}${sortable('CPU, typical')}${sortable('Total memory, best')}${sortable('Total memory, typical')}${sortable('Type check, best')}${sortable('Type check, typical')}</tr></thead>
<tbody>${scores
    .map((s) => `<tr${s.runtime.id === highlight ? ' class="here"' : ''}><td><a href="${urls.runtime(s.runtime.id)}">${inlineIcon(s.runtime.id)}${esc(s.runtime.title)}</a><span class="ver">${esc(s.runtime.version)}</span></td>${cell(s.entries, s.entries)}${cell(s.tasks, `${s.tasks}/${tasks.length}`)}${figure('cpu', s.cpu.best)}${figure('cpu', s.cpu.typical)}${figure('memory', s.memory.best)}${figure('memory', s.memory.typical)}${s.types ? figure('types', s.types.best) + figure('types', s.types.typical) : cell(null, NA) + cell(null, NA)}</tr>`)
    .join('\n')}</tbody></table></div>`
}

export function runtimesPage(model) {
  return layout({
    title: 'Runtimes compared: package efficiency labels',
    description: 'How runtimes and languages compare for each category of task.',
    path: '/runtimes/',
    crumbs: [['Runtimes']],
    model,
    body: `<main>
<h1>Runtimes compared</h1>
<p class="intro">How each runtime or language does on the same tasks. Results describe these specific tasks, not overall language performance.</p>
${model.categories.length > 1 ? `<h2>All categories</h2>${runtimeSection(model.tasks, model, 'All categories')}` : ''}
${model.categories
  .map((c) => `<h2><a href="${urls.category(c.id)}">${esc(c.title)}</a></h2>${runtimeSection(c.tasks, model, c.title)}${c.tasks.length > 1 ? c.tasks.map((d) => `<h3><a href="${urls.task(d.task.id)}">${esc(d.task.title)}</a></h3>${runtimeTable([d], model)}`).join('') : ''}`)
  .join('\n')}
</main>`,
  })
}

// One runtime across every task it has entries in, beside the others.
export function runtimePage(rt, model) {
  const sections = model.categories
    .map((c) => {
      const tasks = c.tasks.filter((d) => d.runtimes.some((r) => r.id === rt.id))
      if (tasks.length === 0) return ''
      return `<h2><a href="${urls.category(c.id)}">${esc(c.title)}</a></h2>
${shelf(['cpu', 'memory', 'types'].map((rankingId) => runtimeCards(tasks, model, c.title, rankingId, rt.id).replace(/^<ul class="shelf[^"]*">|<\/ul>$/g, '')), { limit: Infinity })}
${runtimeTable(tasks, model, rt.id)}
${tasks
  .map((data) => {
    const runtime = data.runtimes.find((r) => r.id === rt.id)
    return `<h3><a href="${urls.task(data.task.id)}#runtime=${rt.id}&amp;ranking=cpu">${esc(data.task.title)}</a></h3>
${tasks.length > 1 ? runtimeTable([data], model, rt.id) : ''}
${rankingTable(data, runtime, runtime.entries, model)}`
  })
  .join('\n')}`
    })
    .join('\n')
  const count = model.tasks.filter((d) => d.runtimes.some((r) => r.id === rt.id)).length
  return layout({
    title: `${rt.title}: package efficiency labels`,
    description: `How ${rt.title} compares with other runtimes and languages, task by task.`,
    path: urls.runtime(rt.id),
    crumbs: [['Runtimes', '/runtimes/'], [rt.title]],
    model,
    body: `<main>
<h1>${esc(rt.title)} ${esc(rt.version)}</h1>
<p class="intro">${esc(rt.title)} in ${plural(count, 'task')}, beside every other runtime and language measured on the same tasks.</p>
${model.categories.length > 1 ? `<h2>All categories</h2>${shelf(['cpu', 'memory', 'types'].map((rankingId) => runtimeCards(model.tasks, model, 'All categories', rankingId, rt.id).replace(/^<ul class="shelf[^"]*">|<\/ul>$/g, '')), { limit: Infinity })}
${runtimeTable(model.tasks, model, rt.id)}` : ''}
${sections}
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
export function creditsPage(model) {
  const link = (href, text) => `<a href="${href}">${text}</a>`
  const marks = [
    [`${inlineIcon('node')} ${inlineIcon('deno')} ${inlineIcon('rust')} ${inlineIcon('python')} ${inlineIcon('ruby')} ${inlineIcon('eco-jsr')} ${inlineIcon('eco-rubygems')}`, 'One-colour marks beside names: Node.js, Deno, Rust, JavaScript, TypeScript, Python, PyPy, Ruby, Go, JSR, RubyGems', link('https://simpleicons.org', 'Simple Icons'), 'CC0 1.0', 'Unchanged'],
    ['', 'Colour marks on the labels: Node.js, Bun, Deno, Rust, TypeScript, Python, Ruby, Go', `${link('https://github.com/gilbarbara/logos', 'SVG Logos')} by Gil Barbara`, 'CC0 1.0', 'Unchanged'],
    [inlineIcon('bun'), 'Bun, beside names', `${link('https://github.com/gilbarbara/logos', 'SVG Logos')} by Gil Barbara`, 'CC0 1.0', 'Redrawn as an outline, without its shadow'],
    [inlineIcon('eco-pypi'), 'PyPI', `${link('https://github.com/gilbarbara/logos', 'SVG Logos')} by Gil Barbara`, 'CC0 1.0', 'Redrawn in one colour: the plain cubes as outlines'],
    [inlineIcon('eco-gomod'), 'Go modules', `The Go gopher, designed by ${link('https://reneefrench.blogspot.com', 'Renee French')}. Artwork from ${link('https://github.com/vscode-icons/vscode-icons', 'vscode-icons')}`, `Gopher: ${link('https://creativecommons.org/licenses/by/3.0/', 'CC BY 3.0')}. Artwork: MIT`, 'Redrawn as an outline'],
    [inlineIcon('eco-cargo'), 'crates.io', `The Cargo logo, from the Rust project. Artwork from ${link('https://github.com/vscode-icons/vscode-icons', 'vscode-icons')}`, 'Artwork: MIT', 'Redrawn in one colour: crates as outlines, markings left out'],
    [inlineIcon('eco-npm'), 'npm', 'The letters of the npm logo, drawn for this site', '', ''],
    [inlineIcon('ruby-yjit'), 'YJIT, beside names and on labels', `The logo in the ${link('https://github.com/Shopify/yjit', 'Shopify/yjit')} README`, '', 'One colour beside names, unchanged on labels'],
    [WRENCH.replace('role="img" aria-label="Tuned"', 'aria-hidden="true"'), 'Tuned settings', `${link('https://fonts.google.com/icons', 'Material Icons')} by Google`, 'Apache 2.0', 'Unchanged'],
  ]
  return layout({
    title: 'Credits: package efficiency labels',
    description: 'Sources and licences of the logos, icons, typeface and package lists used on this site.',
    path: '/credits/',
    crumbs: [['Credits']],
    model,
    body: `<main>
<h1>Credits</h1>
<p class="intro">This site uses other people's artwork to identify runtimes, languages and package registries. The names and logos belong to their projects. Showing them here does not mean those projects endorse or are affiliated with this site.</p>
<h2>Logos and icons</h2>
<div class="scroll"><table class="credits">
<thead><tr><th></th><th>Used for</th><th>Source</th><th>Licence</th><th>Changes</th></tr></thead>
<tbody>
${marks.map(([icon, use, source, licence, changes]) => `<tr><td class="marks">${icon}</td><td>${use}</td><td>${source}</td><td>${licence || '—'}</td><td>${changes || '—'}</td></tr>`).join('\n')}
</tbody>
</table></div>
<p>The category drawings, the efficiency scales and the remaining interface icons were drawn for this site.</p>
<details class="licence"><summary>MIT licence notice for the vscode-icons artwork</summary><pre>${esc(MIT_NOTICE)}</pre></details>
<h2>Code highlighting</h2>
<p>Benchmark source is highlighted when the site is built with ${link('https://highlightjs.org', 'highlight.js')}, under the BSD 3-Clause licence.</p>
<h2>Typeface</h2>
<p>${link('https://fonts.google.com/specimen/Archivo', 'Archivo')} by Omnibus-Type, under the SIL Open Font License 1.1, served by Google Fonts.</p>
<h2>Package lists</h2>
<p>The lists of most-used packages that the categories were drawn from come from ${link('https://packages.ecosyste.ms', 'ecosyste.ms Packages')} (CC BY-SA 4.0) for npm, crates.io, PyPI, RubyGems and Go modules, and from the ${link('https://jsr.io', 'JSR')} registry for JSR.</p>
<h2>Label design</h2>
<p>The labels borrow the look of the European Union energy label. They are not energy labels, and no labelling authority has issued or checked them.</p>
<h2>Benchmarked software</h2>
<p>Every package, runtime and compiler measured here is the work of its own authors and is used under its own licence. Each package page links to its registry entry.</p>
</main>`,
  })
}

// --- Benchmark source ---------------------------------------------------------

// A link into the repository named in site.json: kind is "blob" or "tree".
const repoUrl = (model, kind, file) => `${model.repository.url}/${kind}/${model.repository.branch}/${file.split('/').map(encodeURIComponent).join('/')}`

// One file: its name, a link to it on GitHub, and the highlighted code with
// line numbers in a column of their own so they are not selected with it.
function sourceFile(file, model) {
  const numbers = Array.from({ length: file.lines }, (_, i) => i + 1).join('\n')
  return `<figure class="source" id="${esc(file.name)}">
<figcaption><a class="name" href="#${esc(file.name)}">${esc(file.name)}</a><span class="soft">${plural(file.lines, 'line')}</span><a href="${repoUrl(model, 'blob', file.path)}">View on GitHub</a></figcaption>
<div class="code"><pre class="numbers" aria-hidden="true">${numbers}</pre><pre><code>${file.html}</code></pre></div>
</figure>`
}

const fileIndex = (files) => (files.length > 1 ? `<p class="files">${files.map((f) => `<a href="#${esc(f.name)}">${esc(f.name)}</a>`).join(' ')}</p>` : '')

export function taskSourcePage(data, model) {
  const category = model.categories.find((c) => c.id === data.task.category)
  const files = taskSource(data.task.id)
  const adapters = [...new Map(data.runtimes.flatMap((r) => r.entries).map((e) => [adapterIdOf(e), e])).entries()]
  return layout({
    title: `${data.task.title}, benchmark source: package efficiency labels`,
    description: `The definition and scenario of the ${data.task.title} benchmark.`,
    path: urls.source(data.task.id),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], [category.title, urls.category(category.id)], [data.task.title, urls.task(data.task.id)], ['Source']],
    model,
    body: `<main>
<h1>${esc(data.task.title)} <span class="ver">benchmark source</span></h1>
<p class="intro">What every entry in this task is asked to do: the written rules, the load settings and the scenario each adapter is checked against. <a href="${repoUrl(model, 'tree', `benchmarks/${data.task.id}`)}">This folder on GitHub</a>. The <a href="${repoUrl(model, 'tree', 'harness')}">harness</a> that launches and measures the adapters is shared by all tasks.</p>
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
<p>This entry is a variant: it runs the adapter of <a href="${urls.source(data.task.id, source.variantOf)}">${esc(source.variantOf.split('/').at(-1))}</a> with the settings above.</p>
${source.shared.map((f) => sourceFile({ ...f, name: `${source.variantOf.split('/').at(-1)}/${f.name}` }, model)).join('\n')}`
    : ''
  return layout({
    title: `${entry.title}, ${data.task.title} benchmark source: package efficiency labels`,
    description: `Source code of the ${entry.title} adapter for the ${data.task.title} benchmark.`,
    path: urls.source(data.task.id, adapterId),
    context: { category: data.task.category },
    crumbs: [['Categories', '/categories/'], [category.title, urls.category(category.id)], [data.task.title, urls.task(data.task.id)], ['Source', urls.source(data.task.id)], [entry.title]],
    model,
    body: `<main>
<h1>${esc(entry.title)} <span class="ver">benchmark source</span></h1>
<p class="intro">The adapter that runs ${pkg ? `<a href="${urls.package(pkg)}">${esc(pkg.title)}</a>` : esc(entry.title)} in <a href="${urls.task(data.task.id)}">${esc(data.task.title)}</a>. <a href="${repoUrl(model, 'tree', source.dir)}">This folder on GitHub</a>. See also <a href="${urls.source(data.task.id)}">the task and its scenario</a>.</p>
${fileIndex(source.files)}
${source.files.map((f) => sourceFile(f, model)).join('\n')}
${shared}
</main>`,
  })
}

export function searchIndex(model) {
  return [
    ...model.packages.map((p) => ({ t: p.title, k: ECOSYSTEMS[p.ecosystem].title, u: urls.package(p) })),
    ...model.tasks.map((d) => ({ t: d.task.title, k: 'Task', u: urls.task(d.task.id) })),
    ...model.categories.map((c) => ({ t: c.title, k: 'Category', u: urls.category(c.id) })),
    ...Object.entries(ECOSYSTEMS).map(([id, e]) => ({ t: e.title, k: 'Ecosystem', u: urls.ecosystem(id) })),
    ...model.runtimes.map((rt) => ({ t: rt.title, k: 'Runtime', u: urls.runtime(rt.id) })),
    ...model.index.planned.map((c) => ({ t: c.title, k: 'Not measured yet', u: `/categories/#${c.id}` })),
  ]
}
