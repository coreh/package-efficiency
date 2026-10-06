// The results in forms that are easy to take elsewhere: flat rows for CSV and
// JSON, and Markdown that reads well when pasted into a language model.
import { CLASSES, formatNumber } from './label.mjs'
import { adapterIdOf, adapterSource, taskSource } from './source.mjs'

const cpuOf = (m) => m.cpuPerOperationUs ?? m.cpuPerRequestUs
const unitOf = (data) => (data.task.kind === 'sync-operation' ? 'operation' : 'request')
const isTuned = (entry) => (entry.adapter.tags ?? []).includes('non-default-options')

// One row per entry per runtime. The same columns for every task, so tasks
// can be stacked in one sheet.
// With `ctx` the rows also carry what the pages show beside the figures: the
// medals of the task's three events, and the package's use and rank in its
// registry.
const MEDAL_NAMES = { best: 'gold', second: 'silver', third: 'bronze' }
export function resultRows(data, ctx) {
  const medals = ctx?.eventMedals?.(data)
  return data.runtimes.flatMap((runtime) =>
    runtime.entries.map((e) => {
      const won = medals?.get(`${runtime.id}/${e.id}`) ?? {}
      const listed = ctx?.model?.packageOf(e)?.listed
      return {
      category: data.task.category,
      task: data.task.id,
      ecosystem: e.ecosystem,
      package: e.package,
      entry: e.title,
      version: e.version ?? '',
      settings: e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default',
      language: runtime.language,
      runtime: runtime.title,
      runtime_version: runtime.version,
      cpu_unit: `µs per ${unitOf(data)}`,
      cpu: cpuOf(e.metrics),
      cpu_class: e.grades.cpu?.class ?? '',
      cpu_times_best: e.grades.cpu?.ratio ?? '',
      memory_mb: e.metrics.memoryMb,
      memory_class: e.grades.memory?.class ?? '',
      memory_times_best: e.grades.memory?.ratio ?? '',
      type_check_cost: e.grades.types?.value ?? '',
      type_check_class: e.grades.types?.class ?? '',
      type_check_times_best: e.grades.types?.ratio ?? '',
      total_memory_after_gc_mb: e.metrics.settledRssMb,
      peak_memory_mb: e.metrics.peakRssMb,
      heap_retained_kb: e.metrics.retainedKb,
      import_ms: e.metrics.importMs,
      per_cpu_second: e.metrics.operationsPerCpuSecond ?? e.metrics.requestsPerCpuSecond,
      throughput_per_second: e.metrics.throughputOps ?? e.metrics.throughputRps,
      latency_p99_ms: e.metrics.latencyP99Ms,
      benchmark_source: `benchmarks/${data.task.id}/${adapterIdOf(e)}`,
      ...(ctx ? {
        cpu_medal: MEDAL_NAMES[won.cpu] ?? '',
        memory_medal: MEDAL_NAMES[won.memory] ?? '',
        type_check_medal: MEDAL_NAMES[won.types] ?? '',
        registry_rank: listed?.rank ?? '',
        use: listed?.popularity.value ?? '',
        use_measure: listed?.popularity.label ?? '',
      } : {}),
    }
    }),
  )
}

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
export function toCsv(rows) {
  if (rows.length === 0) return ''
  const columns = Object.keys(rows[0])
  return [columns.join(','), ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(','))].join('\n') + '\n'
}

// --- Markdown -----------------------------------------------------------------

const cellText = (value, unit = '') => (value === null || value === undefined || value === '' ? 'n/a' : `${formatNumber(value)}${unit}`)
const graded = (value, grade, unit) => (grade ? `${cellText(value, unit)} (${grade.class})` : cellText(value, unit))
const mdTable = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ')} |`)].join('\n')
const byCpu = (a, b) => CLASSES.indexOf(a.grades.cpu?.class ?? 'G') - CLASSES.indexOf(b.grades.cpu?.class ?? 'G') || (a.grades.cpu?.ratio ?? Infinity) - (b.grades.cpu?.ratio ?? Infinity)

const READING = (data) => `Classes run from A (best) to G. A class is set by how many times the best result in the task an entry costs, in any language or runtime. CPU is CPU time per ${unitOf(data)} (user and system, all threads). Memory is what the process holds after the task and a garbage collection, above an empty process of the same runtime. Type-check cost is the square root of added compiler CPU time times added compiler memory. Nothing graded uses elapsed time. "Tuned" entries use documented non-default settings; "default" is the package as installed.`

const scaleLine = (name, metric) => (metric?.scale ? `- ${name}: class boundaries at ${metric.scale.join(', ')} times the best${metric.anchor ? `, which is ${metric.anchor.title}${metric.anchor.runtime ? ` on ${metric.anchor.runtime}` : ''} at ${formatNumber(metric.anchor.value)} ${metric.unit}` : ''}.` : null)

// "gold CPU, silver memory": the medals an entry took in its task's events.
const medalText = (ctx, data, runtime, e) => {
  const won = ctx?.eventMedals?.(data).get(`${runtime.id}/${e.id}`) ?? {}
  return Object.entries({ cpu: 'CPU', memory: 'memory', types: 'type check' }).filter(([key]) => won[key]).map(([key, name]) => `${MEDAL_NAMES[won[key]]} ${name}`).join(', ')
}
const MEDALS_NOTE = 'Medals: each task has three events (CPU, memory, type check); among the entries on every runtime the best three figures take gold, silver and bronze, shared when equal, and fewer are given when few entries compete.'
const entryRow = (data, e) => [e.title, e.version ?? (e.builtin ? 'built in' : ''), e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default', graded(cpuOf(e.metrics), e.grades.cpu, ' µs'), graded(e.metrics.memoryMb, e.grades.memory, ' MB'), graded(e.grades.types?.value, e.grades.types), cellText(e.metrics.importMs, ' ms'), cellText(e.metrics.latencyP99Ms, ' ms')]
const ENTRY_HEAD = (data) => ['Entry', 'Version', 'Settings', `CPU per ${unitOf(data)}`, 'Memory', 'Type-check cost', 'Import time', 'Latency p99']

export function taskMarkdown(data, ctx) {
  const { url = (path) => path, edition } = ctx
  return `# ${data.task.title}: package efficiency labels

${data.task.summary}

${READING(data)}

${[scaleLine('CPU', data.metrics.cpu), scaleLine('Memory', data.metrics.memory)].filter(Boolean).join('\n')}

${MEDALS_NOTE}

Measured on ${data.machine.cpu}, ${data.machine.cores} cores, ${data.machine.os}. Edition ${edition}, provisional: one laptop, not a reference machine, and the benchmark adapters were written by an AI coding agent and not reviewed by a person.

${data.runtimes
  .filter((r) => r.entries.length)
  .map((r) => `## ${r.title} ${r.version}\n\n${mdTable([...ENTRY_HEAD(data), 'Medals'], [...r.entries].sort(byCpu).map((e) => [...entryRow(data, e), medalText(ctx, data, r, e)]))}`)
  .join('\n\n')}

## Benchmark source

The task's rules, load settings and the scenario every adapter is checked against${ctx.model ? `, from ${gh(ctx, `benchmarks/${data.task.id}`)}. The harness that launches and measures the adapters: ${gh(ctx, 'harness')}` : ''}.

${taskSource(data.task.id).map((f) => fenced(f, ctx)).join('\n\n')}

## Adapters

One per entry: the code that runs the package in this task.

${[...new Map(data.runtimes.flatMap((r) => r.entries).map((e) => [adapterIdOf(e), e])).entries()].map(([id, e]) => adapterMarkdown(data, id, e, ctx, '###')).join('\n\n')}

## More

- Page: ${url(`/${data.task.id}/`)}
- All figures as CSV: ${url(`/${data.task.id}/results.csv`)}
- All figures as JSON: ${url(`/data/${data.task.id}.json`)}
`
}

export function packageMarkdown(pkg, ecosystemTitle, ctx) {
  const { url = (path) => path, edition } = ctx
  const registry = ctx.ecosystems?.[pkg.ecosystem]?.registry?.(pkg.name)
  const tasks = [...new Set(pkg.appearances.map((a) => a.data))]
  const path = `/${pkg.ecosystem}/${pkg.name}/`
  return `# ${pkg.title}${pkg.version ? ` ${pkg.version}` : ''}: package efficiency labels

${pkg.ecosystem === 'builtin' ? 'Built into its runtime' : `${ecosystemTitle} package`}, measured in ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}.${registry ? ` Registry: ${registry}` : ''}${pkg.listed?.repository ? ` Repository: ${pkg.listed.repository}` : ''}${pkg.listed ? ` Number ${pkg.listed.rank} on ${ecosystemTitle} by ${pkg.listed.popularity.label} (${pkg.listed.popularity.value.toLocaleString('en-US')}).` : ''}

${READING(tasks[0])}

Edition ${edition}, provisional: one laptop, not a reference machine, and the benchmark adapters were written by an AI coding agent and not reviewed by a person.

${tasks
  .map((data) => {
    const rows = pkg.appearances.filter((a) => a.data === data)
    const notes = [...new Map(rows.filter((a) => a.entry.adapter.notes).map((a) => [a.entry.id, `- ${a.entry.title}: ${a.entry.adapter.notes}`])).values()]
    return `## ${data.task.title}\n\n${data.task.summary}\n\n${mdTable(['Runtime', ...ENTRY_HEAD(data), 'Medals'], rows.map(({ runtime, entry }) => [`${runtime.title} ${runtime.version}`, ...entryRow(data, entry), medalText(ctx, data, runtime, entry)]))}${notes.length ? `\n\n${notes.join('\n')}` : ''}\n\nAll entries in this task: ${url(`/${data.task.id}/index.md`)}\n\n${[...new Map(rows.map((a) => [adapterIdOf(a.entry), a.entry])).entries()].map(([id, e]) => adapterMarkdown(data, id, e, ctx, '###')).join('\n\n')}`
  })
  .join('\n\n')}

## More

- Page: ${url(path)}
- These figures as CSV: ${url(`${path}results.csv`)}
- These figures as JSON: ${url(`${path}results.json`)}
`
}

// --- Shared pieces --------------------------------------------------------------

const gh = (ctx, file, kind = 'tree') => `${ctx.model.repository.url}/${kind}/${ctx.model.repository.branch}/${file.split('/').map(encodeURIComponent).join('/')}`
// A file as a fenced block, under its name and its address in the repository.
const fenced = (file, ctx, name = file.name) => `**${name}**${ctx.model ? ` (${gh(ctx, file.path, 'blob')})` : ''}\n\n\`\`\`\`${file.language}\n${file.text}\n\`\`\`\``
// One adapter: who wrote it, its notes, and its files. A variant shows its
// settings and names the adapter whose code it runs.
function adapterMarkdown(data, adapterId, entry, ctx, heading) {
  const source = adapterSource(data.task.id, adapterId)
  const a = entry.adapter
  const who = a.author.kind === 'human' ? 'a person' : `${a.author.agent} (${a.author.model})`
  return `${heading} ${entry.title}

Written by ${who} on ${a.author.date}, ${a.review === 'unreviewed' ? 'not reviewed by a person' : 'reviewed'}.${a.notes ? ` ${a.notes}` : ''}${ctx.model ? ` Folder: ${gh(ctx, source.dir)}` : ''}${source.variantOf ? `\n\nA variant: it runs the code of ${source.variantOf.split('/').at(-1)} with the settings below.` : ''}

${source.files.map((f) => fenced(f, ctx)).join('\n\n')}`
}
const header = (title, ctx) => `# ${title}: package efficiency labels`
const footer = (ctx, path, hasRows) => `## More\n\n- Page: ${ctx.url(path)}${hasRows ? `\n- This list as CSV: ${ctx.url(`${path}results.csv`)}\n- This list as JSON: ${ctx.url(`${path}results.json`)}` : ''}\n- Everything: ${ctx.url('/llms.txt')}\n`
const PROVISIONAL = (ctx) => `Edition ${ctx.edition}, provisional: measured on one laptop, not a reference machine, and the benchmark adapters were written by an AI coding agent and not reviewed by a person.`
const pct = (v) => `${(v * 100).toFixed(v >= 0.0995 ? 0 : v >= 0.00995 ? 1 : 2)}%`

// A measured package's best class in a ranking, on any runtime and in any task.
const bestClass = (pkg, id) => (pkg ? pkg.appearances.map((a) => a.entry.grades[id]?.class).filter(Boolean).sort((a, b) => CLASSES.indexOf(a) - CLASSES.indexOf(b))[0] ?? '' : '')

// Listed packages as rows: the same columns for every list of them.
export const catalogRows = (items, ctx) =>
  items.map((item) => ({
    ecosystem: ctx.ecosystems[item.ecosystem].title,
    package: item.name,
    rank: item.rank ?? '',
    use: item.popularity?.value ?? '',
    use_measure: item.popularity?.label ?? '',
    share_of_registry: Number(item.share.toFixed(6)),
    category: item.category?.title ?? '',
    status: ctx.statusOf(item),
    best_cpu_class: bestClass(item.measured, 'cpu'),
    best_memory_class: bestClass(item.measured, 'memory'),
    latest_version: item.version ?? '',
    registry: ctx.ecosystems[item.ecosystem].registry?.(item.name) ?? '',
    repository: item.repository ?? '',
    page: ctx.url(ctx.catalogUrl(item)),
  }))
// A table that the page shows a page at a time is marked, so "Copy page" can
// put in its place the rows the reader actually has on screen. The Markdown
// file itself always holds every row.
const marked = (key, table) => `<!-- table:${key} -->\n${table}\n<!-- /table -->`
const catalogTableMd = (rows) => marked('catalog', catalogTableMdPlain(rows))
const catalogTableMdPlain = (rows) => mdTable(['Package', 'Ecosystem', 'Rank', 'Use', 'Category', 'Status', 'Best CPU class', 'Best memory class', 'Registry'], rows.map((r) => [`[${r.package}](${r.page})`, r.ecosystem, r.rank || 'n/a', r.use === '' ? 'n/a' : r.use.toLocaleString('en-US'), r.category, r.status, r.best_cpu_class, r.best_memory_class, r.registry]))
const USE = 'Use is the figure each registry is ranked by: downloads per month for npm and PyPI, in total for crates.io and RubyGems, in the last 90 days for JSR, and repositories that depend on it for Go modules.'

// Categories as rows, for the index and for one group.
export function categoryRows(ctx, groupId) {
  const { model } = ctx
  return model.catalog.categories
    .filter((c) => !groupId || c.group === groupId)
    .map((c) => {
      const measured = model.categories.find((m) => m.taxonomy === c.id)
      const members = model.catalog.byCategory.get(c.id) ?? []
      return {
        group: model.catalog.groups.find((g) => g.id === c.group)?.title ?? '',
        category: measured?.title ?? c.title,
        status: measured ? 'Measured' : c.benchmarkable ? 'Not measured yet' : 'No comparable task',
        tasks: measured ? measured.tasks.map((d) => d.task.title).join('; ') : '',
        listed_packages: members.length,
        measured_packages: members.filter((item) => item.measured).length,
        share_of_use: Number((model.catalog.categoryShare.get(c.id) ?? 0).toFixed(6)),
        description: c.description,
        candidate_task: measured ? '' : (c.benchmarkIdea ?? ''),
        page: ctx.url(ctx.categoryHref(c.id, model)),
      }
    })
    .sort((a, b) => (b.status === 'Measured') - (a.status === 'Measured') || b.share_of_use - a.share_of_use)
}

// --- One function per kind of page: its Markdown, and its rows if it lists something

export function categoriesExport(ctx, group) {
  const rows = categoryRows(ctx, group?.id)
  const path = group ? `/categories/${group.id}/` : '/categories/'
  const markdown = `${header(group ? group.title : 'Categories', ctx)}

A category groups packages that can do the same job, so they can run the same task and be compared. ${rows.length} categories${group ? '' : ` in ${ctx.model.catalog.groups.length} groups`}, ${rows.filter((r) => r.status === 'Measured').length} measured so far. Share of use is the part of each registry's listed downloads that goes to the category's packages, averaged over the six registries.

## ${group ? 'Categories and tasks' : 'All categories and tasks'}

${marked('tasks', mdTable(['Category', 'Group', 'Status', 'Listed packages', 'Share of use', 'Task or candidate task'], rows.map((r) => [`[${r.category}](${r.page})`, r.group, r.status, r.listed_packages, pct(r.share_of_use), r.tasks || r.candidate_task || r.description])))}

${footer(ctx, path, true)}`
  return { markdown, rows }
}

// The best result of each package in a task, by CPU: one line per package.
function bestPerPackage(data) {
  const best = new Map()
  for (const runtime of data.runtimes) {
    for (const e of runtime.entries) {
      const key = `${e.ecosystem}/${e.name}@${e.version ?? ''}`
      const held = best.get(key)
      if (!held || (e.grades.cpu?.ratio ?? Infinity) < (held.entry.grades.cpu?.ratio ?? Infinity)) best.set(key, { entry: e, runtime })
    }
  }
  return [...best.values()].sort((a, b) => byCpu(a.entry, b.entry))
}

export function categoryExport(ctx, category) {
  const { model } = ctx
  const rows = category.tasks.flatMap((data) => resultRows(data, ctx))
  const others = (model.catalog.byCategory.get(category.taxonomy) ?? []).filter((item) => !item.measured)
  const path = `/${category.id}/`
  const markdown = `${header(category.title, ctx)}

${category.summary}

${READING(category.tasks[0])}

${PROVISIONAL(ctx)}

${category.tasks
  .map((data) => `## ${data.task.title}\n\n${data.task.summary} Each package on the runtime where it uses the least CPU; every runtime is in ${ctx.url(`/${data.task.id}/index.md`)}.\n\n${mdTable(['Entry', 'Version', 'Settings', 'Best on', `CPU per ${unitOf(data)}`, 'Memory', 'Type-check cost', 'Medals'], bestPerPackage(data).map(({ entry: e, runtime }) => [e.title, e.version ?? '', e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default', runtime.title, graded(cpuOf(e.metrics), e.grades.cpu, ' µs'), graded(e.metrics.memoryMb, e.grades.memory, ' MB'), graded(e.grades.types?.value, e.grades.types), medalText(ctx, data, runtime, e)]))}`)
  .join('\n\n')}

## Packages

${marked('measured', measuredTableMd(ctx, model.packages.filter((p) => p.appearances.some((a) => a.data.task.category === category.id))))}
${others.length ? `\n## Not measured yet in this category\n\n${USE}\n\n${catalogTableMd(catalogRows(others, ctx))}\n` : ''}
${footer(ctx, path, true)}`
  return { markdown, rows }
}

export function listedCategoryExport(ctx, category) {
  const members = ctx.model.catalog.byCategory.get(category.id) ?? []
  const rows = catalogRows(members, ctx)
  const markdown = `${header(category.title, ctx)}

${category.description}

${category.benchmarkable ? `Not measured yet. Candidate task: ${category.benchmarkIdea ?? 'not written yet'}` : 'No comparable task: the packages in this group do not share one job that could be run the same way for all of them, so they are listed but not compared.'}

## Packages

${rows.length ? `${USE}\n\n${catalogTableMd(rows)}` : 'No listed package is in this category.'}

${footer(ctx, `/${category.id}/`, rows.length > 0)}`
  return { markdown, rows: rows.length ? rows : null }
}

export function ecosystemExport(ctx, id) {
  const { model } = ctx
  const eco = ctx.ecosystems[id]
  const listed = model.catalog.byEcosystem[id] ?? []
  const measured = model.packages.filter((p) => p.ecosystem === id)
  const rows = listed.length ? catalogRows(listed, ctx) : measured.flatMap((pkg) => [...new Set(pkg.appearances.map((a) => a.data))].flatMap((data) => resultRows(data, ctx).filter((r) => r.ecosystem === id && r.package === pkg.name)))
  const markdown = `${header(eco.title, ctx)}

${measured.length} measured${listed.length ? `, ${listed.length.toLocaleString('en-US')} listed by ${listed[0].popularity.label}` : ''}.

## Measured

${measured.length ? marked('measured', measuredTableMd(ctx, measured)) : 'Nothing measured in this ecosystem yet.'}
${listed.length ? `\n## Most used packages\n\n${catalogTableMd(rows)}\n` : ''}
${footer(ctx, `/${id}/`, rows.length > 0)}`
  return { markdown, rows: rows.length ? rows : null }
}

const measuredTableMd = (ctx, packages) => mdTable(['Package', 'Ecosystem', 'Version', 'Tasks'], packages.map((p) => [`[${p.title}](${ctx.url(`/${p.ecosystem}/${p.name}/index.md`)})`, ctx.ecosystems[p.ecosystem].title, p.version ?? '', [...new Set(p.appearances.map((a) => a.data.task.title))].join(', ')]))

export function packagesExport(ctx) {
  const { model } = ctx
  // The page's list is every known package; the measured figures are in /results.csv.
  const rows = catalogRows(ctx.allKnownPackages(model), ctx)
  const markdown = `${header('Packages', ctx)}

${model.packages.length} packages measured. ${PROVISIONAL(ctx)}

## All packages

Every known package, measured or not, most used first. ${USE} The measured ones, with their figures, are in ${ctx.url('/results.csv')}.

${marked('measured', catalogTableMdPlain(rows))}

## By registry

${mdTable(['Ecosystem', 'Listed', 'Measured', 'Can be benchmarked', 'No comparable task'], Object.entries(model.catalog.byEcosystem).map(([id, items]) => [`[${ctx.ecosystems[id].title}](${ctx.url(`/${id}/index.md`)})`, items.length, ...['Measured', 'Not benchmarked yet', 'No comparable task'].map((status) => items.filter((item) => ctx.statusOf(item) === status).length)]))}

${footer(ctx, '/packages/', true)}`
  return { markdown, rows }
}

export function tasksExport(ctx) {
  const { model } = ctx
  const rows = model.tasks.map((d) => ({
    category: model.categories.find((c) => c.id === d.task.category).title,
    task: d.task.title,
    summary: d.task.summary,
    entries: new Set(d.runtimes.flatMap((r) => r.entries.map((e) => e.id))).size,
    runtimes: d.runtimes.filter((r) => r.entries.length).map((r) => r.title).join('; '),
    page: ctx.url(`/${d.task.id}/`),
    markdown: ctx.url(`/${d.task.id}/index.md`),
    csv: ctx.url(`/${d.task.id}/results.csv`),
    source: gh(ctx, `benchmarks/${d.task.id}`),
  }))
  const markdown = `${header('Tasks', ctx)}

A task is one job that every package in a category can do, run the same way for all of them.

${mdTable(['Task', 'Category', 'Entries', 'Runs on', 'What it does'], rows.map((r) => [`[${r.task}](${r.markdown})`, r.category, r.entries, r.runtimes, r.summary]))}

Candidate tasks for the categories not measured yet are in ${ctx.url('/categories/index.md')}.

${footer(ctx, '/tasks/', true)}`
  return { markdown, rows }
}

const scoreRows = (ctx, tasks, scope) => {
  const medals = ctx.runtimeMedals(tasks)
  const count = (s, kind) => medals.get(s.runtime.id)?.[kind].length ?? 0
  return ctx.runtimeScores(tasks, ctx.model).map((s) => ({
    scope,
    runtime: s.runtime.title,
    version: s.runtime.version,
    gold: count(s, 'best'),
    silver: count(s, 'second'),
    bronze: count(s, 'third'),
    entries: s.entries,
    tasks: s.tasks,
    cpu_best_times: s.cpu?.best.ratio ?? '',
    cpu_best_class: s.cpu?.best.class ?? '',
    cpu_typical_times: s.cpu?.typical.ratio ?? '',
    memory_best_times: s.memory?.best.ratio ?? '',
    memory_best_class: s.memory?.best.class ?? '',
    memory_typical_times: s.memory?.typical.ratio ?? '',
    type_check_best_times: s.types?.best.ratio ?? '',
    type_check_best_class: s.types?.best.class ?? '',
  })).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
}
const scoreTableMd = (rows) => mdTable(['Runtime', 'Version', 'Gold', 'Silver', 'Bronze', 'Entries', 'CPU, best', 'CPU, typical', 'Memory, best', 'Memory, typical', 'Type check, best'], rows.map((r) => [r.runtime, r.version, r.gold, r.silver, r.bronze, r.entries, r.cpu_best_times === '' ? 'n/a' : `${formatNumber(r.cpu_best_times)}× (${r.cpu_best_class})`, r.cpu_typical_times === '' ? 'n/a' : `${formatNumber(r.cpu_typical_times)}×`, r.memory_best_times === '' ? 'n/a' : `${formatNumber(r.memory_best_times)}× (${r.memory_best_class})`, r.memory_typical_times === '' ? 'n/a' : `${formatNumber(r.memory_typical_times)}×`, r.type_check_best_times === '' ? 'n/a' : `${formatNumber(r.type_check_best_times)}× (${r.type_check_best_class})`]))
const SCORES = 'Runtimes are listed by medals, most golds first: every task has three events (CPU, memory, type check), the best three figures among the entries on every runtime take gold, silver and bronze, shared when equal, and a runtime is credited with each medal an entry won on it. Figures are multiples of the best result in any language. Best is the most efficient entry on the runtime; typical is the geometric mean of all its entries. Runtime memory is total memory after the task and a garbage collection.'

export function runtimesExport(ctx) {
  const { model } = ctx
  const sections = [['All categories', model.tasks], ...model.categories.map((c) => [c.title, c.tasks])]
  const rows = sections.flatMap(([scope, tasks]) => scoreRows(ctx, tasks, scope))
  const markdown = `${header('Runtimes compared', ctx)}

${SCORES} ${PROVISIONAL(ctx)}

${sections.map(([scope]) => `## ${scope}\n\n${scoreTableMd(rows.filter((r) => r.scope === scope))}`).join('\n\n')}

${footer(ctx, '/runtimes/', true)}`
  return { markdown, rows }
}

export function runtimeExport(ctx, rt) {
  const { model } = ctx
  const tasks = model.tasks.filter((d) => d.runtimes.some((r) => r.id === rt.id && r.entries.length))
  const rows = tasks.flatMap((data) => resultRows(data, ctx).filter((r) => r.runtime === rt.title))
  const markdown = `${header(`${rt.title} ${rt.version}`, ctx)}

${READING(tasks[0] ?? model.tasks[0])}

${PROVISIONAL(ctx)}

## Against the other runtimes

${SCORES}

${scoreTableMd(scoreRows(ctx, tasks, 'All tasks'))}

${tasks
  .map((data) => {
    const runtime = data.runtimes.find((r) => r.id === rt.id)
    return `## ${data.task.title}\n\n${mdTable([...ENTRY_HEAD(data), 'Medals'], [...runtime.entries].sort(byCpu).map((e) => [...entryRow(data, e), medalText(ctx, data, runtime, e)]))}`
  })
  .join('\n\n')}

${footer(ctx, `/runtimes/${rt.id}/`, true)}`
  return { markdown, rows }
}

export function catalogPackageExport(ctx, item) {
  const eco = ctx.ecosystems[item.ecosystem]
  const status = ctx.statusOf(item)
  const markdown = `${header(item.name, ctx)}

${eco.title} package${item.version ? `, latest version ${item.version}` : ''}. Number ${item.rank} by ${item.popularity.label} (${item.popularity.value.toLocaleString('en-US')}).${item.description ? ` ${item.description}` : ''}

**${status}.** ${item.category ? `Category: [${item.category.title}](${ctx.url(ctx.categoryHref(item.category.id, ctx.model))}).` : 'No category yet.'}${item.category?.benchmarkIdea ? ` Candidate task: ${item.category.benchmarkIdea}` : ''}

- Registry: ${eco.registry(item.name)}${item.repository ? `\n- Repository: ${item.repository}` : ''}${item.typeCheck ? `\n- Type check: adds ${formatNumber(item.typeCheck.cpuMs)} ms of compiler CPU time and ${formatNumber(item.typeCheck.memoryMb)} MB of compiler memory with ${item.typeCheck.tool}, a cost of ${formatNumber(item.typeCheck.cost)} (ungraded: a class needs a shared task)` : ''}

${footer(ctx, ctx.catalogUrl(item), false)}`
  return { markdown, rows: null }
}

export function taskSourceExport(ctx, data) {
  const markdown = `${header(`${data.task.title}, benchmark source`, ctx)}

What every entry in this task is asked to do. Folder: ${gh(ctx, `benchmarks/${data.task.id}`)}. Harness: ${gh(ctx, 'harness')}.

${taskSource(data.task.id).map((f) => fenced(f, ctx)).join('\n\n')}

## Adapters

${[...new Map(data.runtimes.flatMap((r) => r.entries).map((e) => [adapterIdOf(e), e])).entries()].map(([id, e]) => `- [${e.title}](${ctx.url(`/source/${data.task.id}/${id}/index.md`)})`).join('\n')}

${footer(ctx, `/source/${data.task.id}/`, false)}`
  return { markdown, rows: null }
}

export function adapterSourceExport(ctx, data, adapterId) {
  const entry = data.runtimes.flatMap((r) => [...r.entries, ...r.history]).find((e) => adapterIdOf(e) === adapterId)
  const source = adapterSource(data.task.id, adapterId)
  const markdown = `${header(`${entry.title}, ${data.task.title} benchmark source`, ctx)}

${adapterMarkdown(data, adapterId, entry, ctx, '##')}
${source.shared.length ? `\n## Code it runs\n\n${source.shared.map((f) => fenced(f, ctx, `${source.variantOf.split('/').at(-1)}/${f.name}`)).join('\n\n')}\n` : ''}
The task and its scenario: ${ctx.url(`/source/${data.task.id}/index.md`)}

${footer(ctx, `/source/${data.task.id}/${adapterId}/`, false)}`
  return { markdown, rows: null }
}

export function homeExport(ctx) {
  const rows = ctx.model.tasks.flatMap((data) => resultRows(data, ctx))
  return { markdown: llmsText(ctx.model, ctx.ecosystems, ctx).replace(/(## Packages\n\n)([\s\S]*?)(\n\n## )/, (_, head, list, next) => `${head}${marked('measured', list)}${next}`).replace(/\n## Data[\s\S]*$/, `\n## More\n\n- [Categories](${ctx.url('/categories/index.md')}), [tasks](${ctx.url('/tasks/index.md')}), [packages](${ctx.url('/packages/index.md')}), [runtimes](${ctx.url('/runtimes/index.md')})\n- All results as CSV: ${ctx.url('/results.csv')}\n- All results as JSON: ${ctx.url('/results.json')}\n- Source: ${ctx.model.repository.url}\n`), rows }
}

export const creditsExport = (ctx) => ({
  rows: null,
  markdown: `${header('Credits', ctx)}

This site uses other people's artwork to identify runtimes, languages and package registries. The names and logos belong to their projects; showing them does not mean those projects endorse or are affiliated with this site.

- One-colour marks beside names: Simple Icons (https://simpleicons.org), CC0 1.0.
- Colour marks on labels, and the Bun, PyPI and assistant marks: SVG Logos by Gil Barbara (https://github.com/gilbarbara/logos), CC0 1.0.
- Go gopher: designed by Renee French, CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/); artwork from vscode-icons (MIT), redrawn as an outline.
- Cargo logo: from the Rust project; artwork from vscode-icons (MIT), redrawn in one colour.
- YJIT logo: from the Shopify/yjit README.
- Wrench: Material Icons by Google, Apache 2.0.
- Code highlighting: highlight.js, BSD 3-Clause.
- Typeface: Archivo by Omnibus-Type, SIL Open Font License 1.1.
- Package lists: ecosyste.ms Packages (CC BY-SA 4.0) and the JSR registry.
- The labels borrow the look of the European Union energy label; they are not energy labels.

${footer(ctx, '/credits/', false)}`,
})

// The llms.txt convention: a short description and a list of Markdown pages.
export function llmsText(model, ecosystems, { url = (path) => path }) {
  return `# Package efficiency labels

> Efficiency classes from A to G for software packages across npm, JSR, PyPI, RubyGems, Go modules and crates.io: CPU time, memory and type-check cost, measured per task and graded against the best implementation in any language or runtime. Edition ${model.index.edition}, provisional.

Every page has a Markdown version at the same address with index.md added. Pages that list something also have results.csv and results.json there. Task and package pages include the benchmark's source code.

## Indexes

- [Categories](${url('/categories/index.md')}): every category by group, measured or not, with its task or candidate task
- [Tasks](${url('/tasks/index.md')})
- [Packages](${url('/packages/index.md')})
- [Runtimes compared](${url('/runtimes/index.md')})

## Tasks

${model.tasks.map((d) => `- [${d.task.title}](${url(`/${d.task.id}/index.md`)}): ${d.task.summary}`).join('\n')}

## Packages

${model.packages.map((p) => `- [${p.title}](${url(`/${p.ecosystem}/${p.name}/index.md`)}): ${ecosystems[p.ecosystem].title}`).join('\n')}

## Data

- [All results, CSV](${url('/data/results.csv')}): one row per entry per runtime, every task
- [All results, JSON](${url('/data/results.json')}): the same rows
- [Index of tasks and categories, JSON](${url('/data/index.json')})
`
}
