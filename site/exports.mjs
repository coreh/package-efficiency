// The results in forms that are easy to take elsewhere: flat rows for CSV and
// JSON, and Markdown that reads well when pasted into a language model.
import { CLASSES, formatBytes, formatNumber } from './label.mjs'
import { adapterIdOf, adapterSource, taskSource } from './source.mjs'

const cpuOf = (m) => m.startupCpuMs ?? m.cpuPerOperationUs ?? m.cpuPerRequestUs
const cpuUnit = (m) => (m.startupCpuMs != null ? ' ms' : ' µs')
const unitOf = (data) => (data.task.kind === 'sync-operation' || data.task.kind === 'async-operation' ? 'operation' : data.task.kind === 'server-startup' ? 'start' : 'request')
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
      cpu_unit: `${cpuUnit(e.metrics).trim()} per ${unitOf(data)}`,
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
      install_bytes: e.metrics.installBytes ?? null,
      install_packages: e.metrics.installPackages ?? null,
      install_kind: e.metrics.installKind ?? null,
      per_cpu_second: e.metrics.operationsPerCpuSecond ?? e.metrics.requestsPerCpuSecond,
      throughput_per_second: e.metrics.throughputOps ?? e.metrics.throughputRps,
      latency_p99_ms: e.metrics.latencyP99Ms,
      benchmark_source: `benchmarks/${data.task.adaptersFrom ?? data.task.id}/${adapterIdOf(e)}`,
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

const READING = (data) => `Classes go from A (best) to G. A class shows how many times the best result in the task an entry costs, in any language or runtime. CPU is CPU time per ${unitOf(data)} (user and system, all threads). Memory is what the process holds after the task and a garbage collection (its physical footprint, not its resident size). The same runtime with a do-nothing adapter on the same inputs is subtracted. Type-check cost is added compiler CPU time multiplied by added compiler memory, in MB·s. Each of its class boundaries is the CPU boundary multiplied by the memory boundary. Its class compares a package with the lowest-cost package in its category, not only in the task. The memory scale is narrower than the CPU scale (G is above 16 times the best, compared with 50 for CPU), because memory results are closer together. No class uses elapsed time. A "tuned" entry uses documented settings that are not the default. A "default" entry is the package as installed.`

const scaleLine = (name, metric) => (metric?.scale ? `- ${name}: class boundaries at ${metric.scale.join(', ')} times the best${metric.anchor ? `, which is ${metric.anchor.title}${metric.anchor.runtime ? ` on ${metric.anchor.runtime}` : ''} at ${formatNumber(metric.anchor.value)} ${metric.unit}` : ''}.` : null)

// "gold CPU, silver memory": the medals an entry took in its task's events.
const medalText = (ctx, data, runtime, e) => {
  const won = ctx?.eventMedals?.(data).get(`${runtime.id}/${e.id}`) ?? {}
  return Object.entries({ cpu: 'CPU', memory: 'memory', types: 'type check' }).filter(([key]) => won[key]).map(([key, name]) => `${MEDAL_NAMES[won[key]]} ${name}`).join(', ')
}
const MEDALS_NOTE = 'Medals: each task has three events (CPU, memory, type check). In each event, the best three figures among the entries on all runtimes get gold, silver and bronze. Equal figures share a medal. Fewer medals are given when few entries compete.'
// Size once installed, with how many packages that is; for Rust, what the
// crate adds to the compiled binary.
const installText = (m) => m.installBytes == null ? '' : `${formatBytes(m.installBytes)}${m.installKind === 'binary' ? ' added to the binary' : m.installPackages ? ` in ${m.installPackages} ${m.installPackages === 1 ? 'package' : 'packages'}` : ''}`
const entryRow = (data, e) => [e.title, e.version ?? (e.builtin ? 'built in' : ''), e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default', graded(cpuOf(e.metrics), e.grades.cpu, cpuUnit(e.metrics)), graded(e.metrics.memoryMb, e.grades.memory, ' MB'), graded(e.grades.types?.value, e.grades.types), cellText(e.metrics.importMs, ' ms'), installText(e.metrics), cellText(e.metrics.latencyP99Ms, ' ms')]
const ENTRY_HEAD = (data) => ['Entry', 'Version', 'Settings', `CPU per ${unitOf(data)}`, 'Memory', 'Type-check cost', 'Import time', 'Size on disk', 'Latency p99']

export function taskMarkdown(data, ctx) {
  const { url = (path) => path, edition } = ctx
  // A strict task and its lenient task name each other (task.json `strictness`, `pairedWith`).
  const pair = data.task.strictness && data.task.pairedWith ? (data.task.strictness === 'lenient'
    ? `\n\nThis is the lenient task of a pair. It runs the adapters of the strict task, ${data.task.pairedWith} (${url(`/${data.task.pairedWith}/index.md`)}), on the same inputs, with a check that leaves out or forgives one stated kind of difference (task.md, below). An entry that passes here and not there says so in its note.`
    : `\n\nThis is the strict task of a pair. The lenient task, ${data.task.pairedWith} (${url(`/${data.task.pairedWith}/index.md`)}), runs the same adapters on the same inputs with a check that forgives one stated kind of difference; an entry that does not pass here may have a class there.`) : ''
  return `# ${data.task.title}: Package Efficiency Labels

${data.task.summary}${pair}

${READING(data)}

${[scaleLine('CPU', data.metrics.cpu), scaleLine('Memory', data.metrics.memory)].filter(Boolean).join('\n')}

${MEDALS_NOTE}

Measured on ${data.machine.cpu}, ${data.machine.cores} cores, ${data.machine.os}. Provisional. All results come from one developer laptop, not a reference machine. AI coding agents wrote the benchmark adapters, and most are not yet reviewed by a human; those that are carry a mark.

${data.runtimes
  .filter((r) => r.entries.length)
  .map((r) => `## ${r.title} ${r.version}\n\n${mdTable([...ENTRY_HEAD(data), 'Medals'], [...r.entries].sort(byCpu).map((e) => [...entryRow(data, e), medalText(ctx, data, r, e)]))}`)
  .join('\n\n')}

## Benchmark source

The rules of the task, its load settings, and the scenario that checks every adapter${ctx.model ? `, from ${gh(ctx, `benchmarks/${data.task.id}`)}. The harness that starts and measures the adapters: ${gh(ctx, 'harness')}` : ''}.

${taskSource(data.task.id).map((f) => fenced(f, ctx)).join('\n\n')}

## Adapters

One per entry: the code that runs the package in this task.

${(() => {
  const adapters = new Map(data.runtimes.flatMap((r) => r.entries).map((e) => [adapterIdOf(e), e]))
  const listed = new Set(adapters.keys())
      return [...adapters.entries()].map(([id, e]) => adapterMarkdown(data, id, e, ctx, '###', listed)).join('\n\n')
})()}

## More

- Page: ${url(`/${data.task.id}/`)}
- All figures as CSV: ${url(`/${data.task.id}/results.csv`)}
- All figures as JSON: ${url(`/data/${data.task.id}.json`)}
`
}

export function packageMarkdown(pkg, ecosystemTitle, ctx) {
  const { url = (path) => path, edition } = ctx
  const registry = ctx.ecosystems?.[pkg.ecosystem]?.registry?.(pkg.module ?? pkg.name)
  const tasks = [...new Set(pkg.appearances.map((a) => a.data))]
  const path = `/${pkg.ecosystem}/${pkg.name}/`
  const shownApps = new Set()
  return `# ${pkg.title}${pkg.version ? ` ${pkg.version}` : ''}: Package Efficiency Labels

${pkg.ecosystem === 'builtin' ? 'Built into its runtime' : `${ecosystemTitle} package`}, measured in ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}.${registry ? ` Registry: ${registry}` : ''}${pkg.listed?.repository ? ` Repository: ${pkg.listed.repository}` : ''}${pkg.listed ? ` Number ${pkg.listed.rank} on ${ecosystemTitle} by ${pkg.listed.popularity.label} (${pkg.listed.popularity.value.toLocaleString('en-US')}).` : ''}

${READING(tasks[0])}

Provisional. All results come from one developer laptop, not a reference machine. AI coding agents wrote the benchmark adapters, and most are not yet reviewed by a human; those that are carry a mark.

${tasks
  .map((data) => {
    const rows = pkg.appearances.filter((a) => a.data === data)
    const notes = [...new Map(rows.filter((a) => a.entry.adapter.notes).map((a) => [a.entry.id, `- ${a.entry.title}: ${a.entry.adapter.notes}`])).values()]
    return `## ${data.task.title}\n\n${data.task.summary}\n\n${mdTable(['Runtime', ...ENTRY_HEAD(data), 'Medals'], rows.map(({ runtime, entry }) => [`${runtime.title} ${runtime.version}`, ...entryRow(data, entry), medalText(ctx, data, runtime, entry)]))}${notes.length ? `\n\n${notes.join('\n')}` : ''}\n\nAll entries in this task: ${url(`/${data.task.id}/index.md`)}\n\n${(() => {
      const adapters = new Map(rows.map((a) => [adapterIdOf(a.entry), a.entry]))
      // A shared application is listed once for the whole document.
      const listed = new Set([...adapters.keys(), ...shownApps])
      const remember = () => { for (const key of listed) if (key.startsWith('app:')) shownApps.add(key) }
      const text = [...adapters.entries()].map(([id, e]) => adapterMarkdown(data, id, e, ctx, '###', listed)).join('\n\n')
      remember()
      return text
    })()}`
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
// One adapter: who wrote it, its notes, and its files. A variant has only
// settings of its own, so the code it runs (another adapter's) follows them,
// unless that adapter is in the same document (`listed`).
// The shared application an entry runs: its files once in a document (`listed`
// remembers it), and after that only its name.
function appMarkdown(source, ctx, listed) {
  if (!source.app) return ''
  const name = source.app.dir.split('/_shared/')[1], key = `app:${source.app.dir}`
  if (listed.has(key)) return `\n\nIt runs the same application as above, \`${name}\`.`
  listed.add(key)
  return `\n\nThe application it runs, shared by every task of this category${ctx.model ? ` (${gh(ctx, source.app.dir)})` : ''}:\n\n${source.app.files.map((f) => fenced(f, ctx, `${name}/${f.name}`)).join('\n\n')}`
}
function adapterMarkdown(data, adapterId, entry, ctx, heading, listed = new Set()) {
  const source = adapterSource(data.task.id, adapterId)
  const a = entry.adapter
  const who = a.author.kind === 'human' ? 'a human' : `${a.author.agent} (${a.author.model})`
  return `${heading} ${entry.title}

Written by ${who} on ${a.author.date}, ${a.review === 'unreviewed' ? 'not reviewed by a human' : 'reviewed'}.${a.notes ? ` ${a.notes}` : ''}${ctx.model ? ` Folder: ${gh(ctx, source.dir)}` : ''}${source.variantOf ? `\n\nA variant: it runs the code of ${source.variantOf.split('/').at(-1)} with the settings below.` : ''}

${source.files.map((f) => fenced(f, ctx)).join('\n\n')}${source.variantOf && !listed.has(source.variantOf) ? `\n\nThe code it runs:\n\n${source.shared.map((f) => fenced(f, ctx, `${source.variantOf.split('/').at(-1)}/${f.name}`)).join('\n\n')}` : ''}${appMarkdown(source, ctx, listed)}`
}
const header = (title, ctx) => `# ${title}: Package Efficiency Labels`
const footer = (ctx, path, hasRows) => `## More\n\n- Page: ${ctx.url(path)}${hasRows ? `\n- This list as CSV: ${ctx.url(`${path}results.csv`)}\n- This list as JSON: ${ctx.url(`${path}results.json`)}` : ''}\n- Everything: ${ctx.url('/llms.txt')}\n`
const PROVISIONAL = (ctx) => `Provisional. All results come from one developer laptop, not a reference machine. AI coding agents wrote the benchmark adapters, and most are not yet reviewed by a human; those that are carry a mark.`
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
const USE = 'Use is downloads per month for npm and PyPI, total downloads for crates.io and RubyGems, downloads in the last 90 days for JSR, and dependent repositories for Go modules.'

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
        status: measured ? 'Measured' : c.benchmarkable ? 'No benchmark yet' : 'No comparable task',
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

A category is a group of packages that can do the same job. They can run the same task, so they can be compared. ${rows.length} categories${group ? '' : ` in ${ctx.model.catalog.groups.length} groups`}, ${rows.filter((r) => r.status === 'Measured').length} are measured. Share of use is the part of the listed downloads of each registry that goes to the packages of the category. It is the mean of the six registries.

## ${group ? 'Categories and tasks' : 'All categories and tasks'}

${marked('tasks', mdTable(['Task or candidate task', 'Category', 'Group', 'Status', 'Listed packages', 'Share of use'], rows.map((r) => [r.tasks || r.candidate_task || r.description, `[${r.category}](${r.page})`, r.group, r.status, r.listed_packages, pct(r.share_of_use)])))}

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
  .map((data) => `## ${data.task.title}\n\n${data.task.summary} Each package on the runtime where it uses the least CPU; every runtime is in ${ctx.url(`/${data.task.id}/index.md`)}.\n\n${mdTable(['Entry', 'Version', 'Settings', 'Best on', `CPU per ${unitOf(data)}`, 'Memory', 'Type-check cost', 'Medals'], bestPerPackage(data).map(({ entry: e, runtime }) => [e.title, e.version ?? '', e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default', runtime.title, graded(cpuOf(e.metrics), e.grades.cpu, cpuUnit(e.metrics)), graded(e.metrics.memoryMb, e.grades.memory, ' MB'), graded(e.grades.types?.value, e.grades.types), medalText(ctx, data, runtime, e)]))}`)
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

${category.benchmarkable ? `Not measured yet. Candidate task: ${category.benchmarkIdea ?? 'not written yet'}` : 'No comparable task. The packages in this group have no one job that all of them can run the same way. They are listed, but not compared.'}

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

Every listed package, measured or not, most used first. ${USE} The measured packages, with their figures, are in ${ctx.url('/results.csv')}.

${marked('measured', catalogTableMdPlain(rows))}

## By registry

${mdTable(['Ecosystem', 'Listed', 'Measured', 'Benchmark not run yet', 'No benchmark yet', 'No comparable task'], Object.entries(model.catalog.byEcosystem).map(([id, items]) => [`[${ctx.ecosystems[id].title}](${ctx.url(`/${id}/index.md`)})`, items.length, ...['Measured', 'Benchmark not run yet', 'No benchmark yet', 'No comparable task'].map((status) => items.filter((item) => ctx.statusOf(item) === status).length)]))}

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

A task is one job that every package in a category can do. All of them run it the same way.

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
const SCORES = 'Runtimes are sorted by medals, most golds first. Each task has three events (CPU, memory, type check). In each event, the best three figures among the entries on all runtimes get gold, silver and bronze, and equal figures share a medal. A runtime gets each medal that an entry won on it. Each figure is a multiple of the best result in any language. Best is the best entry on the runtime. Typical is the geometric mean of all its entries. Runtime memory is all that the process holds after the task and a garbage collection.'

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

- Registry: ${eco.registry(item.name)}${item.repository ? `\n- Repository: ${item.repository}` : ''}${item.typeCheck ? `\n- Type check: adds ${formatNumber(item.typeCheck.cpuMs)} ms of compiler CPU time and ${formatNumber(item.typeCheck.memoryMb)} MB of compiler memory with ${item.typeCheck.tool}, a cost of ${formatNumber(item.typeCheck.cost)} MB·s (ungraded: a class needs a shared task)` : ''}

${footer(ctx, ctx.catalogUrl(item), false)}`
  return { markdown, rows: null }
}

// One result, the Markdown of its permalink page.
export function resultExport(ctx, data, runtime, entry, path) {
  const markdown = `${header(`${entry.title}${entry.version ? ` ${entry.version}` : ''} on ${runtime.title} ${runtime.version}, ${data.task.title}`, ctx)}

One result. ${data.task.summary} A class compares it with the best result in the task, in any language or runtime; every entry is in ${ctx.url(`/${data.task.id}/index.md`)}.

${mdTable([...ENTRY_HEAD(data), 'Medals'], [[...entryRow(data, entry), medalText(ctx, data, runtime, entry)]])}

Measured on ${data.machine.cpu}, ${data.machine.cores} cores, ${data.machine.os}.

${adapterMarkdown(data, adapterIdOf(entry), entry, ctx, '##')}

${footer(ctx, path, false)}`
  return { markdown }
}

export function taskSourceExport(ctx, data) {
  const markdown = `${header(`${data.task.title}, benchmark source`, ctx)}

What each entry in this task must do. Folder: ${gh(ctx, `benchmarks/${data.task.id}`)}. Harness: ${gh(ctx, 'harness')}.

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

This site uses the artwork of other people to identify runtimes, languages and package registries. The names and logos belong to their projects. Their use here does not mean that those projects endorse this site or are affiliated with it.

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

// Packages from the registries' lists and the hand-picked ones; runtime built-ins are not packages.
const measuredCount = (model) => model.packages.filter((p) => p.ecosystem !== 'builtin').length
const listedCount = (model) => Math.max(new Set(Object.values(model.catalog.byEcosystem).flat().map((item) => `${item.ecosystem}/${item.name}`)).size, measuredCount(model))
// The llms.txt convention: a short description and a list of Markdown pages.
export function llmsText(model, ecosystems, { url = (path) => path }) {
  return `# Package Efficiency Labels

> Efficiency classes from A to G for software packages across npm, JSR, PyPI, RubyGems, Go modules and crates.io: CPU time, memory and type-check cost, measured per task and compared with the best result in any language or runtime. Provisional, and updated as packages are measured.

Switching languages, runtimes, frameworks and libraries has never been cheaper, yet compute and RAM keep getting pricier.

This website aims to help developers and agents alike make informed decisions about the efficiency of various packages across ecosystems. It's semi-scientific (see Limitations below), inspired by the power efficiency labels used across the EU and other regions. Not affiliated with any package or runtime.

Choose a category or search for packages to get started. Currently listing ${listedCount(model).toLocaleString('en-US')} packages, out of which ${measuredCount(model).toLocaleString('en-US')} have been benchmarked and compared across ${model.tasks.length} tasks. Last updated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.

Each page has a Markdown version at the same address with index.md added. A page with a list also has results.csv and results.json there. Task and package pages include the benchmark source code.

## Limitations

- All results come from one developer laptop, and other work was running on it. A reference machine will replace it.
- AI coding agents wrote the benchmark adapters. Most are not yet reviewed by a human; those that are carry a mark.
- A category has one or a few tasks. A task shows how a package does that job on those inputs, not how it does everything.
- Packages run with their default settings unless an entry says otherwise. A package tuned for your case can do better.
- A class compares a result with the best result measured for the task. It changes when a better entry arrives.
- Every package is installed at a release at least seven days old, so the newest release of a package can be missing.
- CPU time and memory are measured, not energy. The labels are not an official rating.

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
