// The results in forms that are easy to take elsewhere: flat rows for CSV and
// JSON, and Markdown that reads well when pasted into a language model.
import { CLASSES, formatNumber } from './label.mjs'
import { adapterIdOf } from './source.mjs'

const cpuOf = (m) => m.cpuPerOperationUs ?? m.cpuPerRequestUs
const unitOf = (data) => (data.task.kind === 'sync-operation' ? 'operation' : 'request')
const isTuned = (entry) => (entry.adapter.tags ?? []).includes('non-default-options')

// One row per entry per runtime. The same columns for every task, so tasks
// can be stacked in one sheet.
export function resultRows(data) {
  return data.runtimes.flatMap((runtime) =>
    runtime.entries.map((e) => ({
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
    })),
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

const entryRow = (data, e) => [e.title, e.version ?? (e.builtin ? 'built in' : ''), e.builtin ? 'built in' : isTuned(e) ? 'tuned' : 'default', graded(cpuOf(e.metrics), e.grades.cpu, ' µs'), graded(e.metrics.memoryMb, e.grades.memory, ' MB'), graded(e.grades.types?.value, e.grades.types), cellText(e.metrics.importMs, ' ms'), cellText(e.metrics.latencyP99Ms, ' ms')]
const ENTRY_HEAD = (data) => ['Entry', 'Version', 'Settings', `CPU per ${unitOf(data)}`, 'Memory', 'Type-check cost', 'Import time', 'Latency p99']

export function taskMarkdown(data, { url = (path) => path, edition }) {
  return `# ${data.task.title}: package efficiency labels

${data.task.summary}

${READING(data)}

${[scaleLine('CPU', data.metrics.cpu), scaleLine('Memory', data.metrics.memory)].filter(Boolean).join('\n')}

Measured on ${data.machine.cpu}, ${data.machine.cores} cores, ${data.machine.os}. Edition ${edition}, provisional: one laptop, not a reference machine, and the benchmark adapters were written by an AI coding agent and not reviewed by a person.

${data.runtimes
  .filter((r) => r.entries.length)
  .map((r) => `## ${r.title} ${r.version}\n\n${mdTable(ENTRY_HEAD(data), [...r.entries].sort(byCpu).map((e) => entryRow(data, e)))}`)
  .join('\n\n')}

## More

- Page: ${url(`/${data.task.id}/`)}
- All figures as CSV: ${url(`/${data.task.id}/results.csv`)}
- All figures as JSON: ${url(`/data/${data.task.id}.json`)}
- Benchmark source: ${url(`/source/${data.task.id}/`)}
`
}

export function packageMarkdown(pkg, ecosystemTitle, { url = (path) => path, edition }) {
  const tasks = [...new Set(pkg.appearances.map((a) => a.data))]
  const path = `/${pkg.ecosystem}/${pkg.name}/`
  return `# ${pkg.title}${pkg.version ? ` ${pkg.version}` : ''}: package efficiency labels

${pkg.ecosystem === 'builtin' ? 'Built into its runtime' : `${ecosystemTitle} package`}, measured in ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}.

${READING(tasks[0])}

Edition ${edition}, provisional: one laptop, not a reference machine, and the benchmark adapters were written by an AI coding agent and not reviewed by a person.

${tasks
  .map((data) => {
    const rows = pkg.appearances.filter((a) => a.data === data)
    const notes = [...new Map(rows.filter((a) => a.entry.adapter.notes).map((a) => [a.entry.id, `- ${a.entry.title}: ${a.entry.adapter.notes}`])).values()]
    return `## ${data.task.title}\n\n${data.task.summary}\n\n${mdTable(['Runtime', ...ENTRY_HEAD(data)], rows.map(({ runtime, entry }) => [`${runtime.title} ${runtime.version}`, ...entryRow(data, entry)]))}${notes.length ? `\n\n${notes.join('\n')}` : ''}\n\nAll entries in this task: ${url(`/${data.task.id}/index.md`)}`
  })
  .join('\n\n')}

## More

- Page: ${url(path)}
- These figures as CSV: ${url(`${path}results.csv`)}
- These figures as JSON: ${url(`${path}results.json`)}
`
}

// The llms.txt convention: a short description and a list of Markdown pages.
export function llmsText(model, ecosystems, { url = (path) => path }) {
  return `# Package efficiency labels

> Efficiency classes from A to G for software packages across npm, JSR, PyPI, RubyGems, Go modules and crates.io: CPU time, memory and type-check cost, measured per task and graded against the best implementation in any language or runtime. Edition ${model.index.edition}, provisional.

Every task and package page has a Markdown version at the same address with index.md added, and its figures as CSV and JSON.

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
