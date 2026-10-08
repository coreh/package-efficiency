// The site's machine-readable files, documented as an API: an OpenAPI 3.1
// description of every address that answers with JSON, CSV, Markdown or an
// SVG label, and the reference page drawn from that same description, so the
// two cannot disagree.
//
// Everything imported from pages.mjs is used inside functions only, so that
// pages.mjs may import this file in turn.
import { RANKINGS, resultPath, shortCodes } from './label.mjs'
import { ECOSYSTEMS, allKnownPackages, catalogUrl, categoryHref, eventMedals, runtimeMedals, runtimeScores, searchIndex, statusOf, urls, versionsOf } from './pages.mjs'
import { adapterIdOf, highlighted } from './source.mjs'
import * as exportsOf from './exports.mjs'

const SITE = 'https://package-efficiency.org'
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const siteOf = (model) => (model.site?.url || SITE).replace(/\/$/, '')

// --- Examples: real names from the model, so that every example address exists

// One task, and in it one result of a package from a registry: the names that
// fill the path parameters of every example.
function examplesOf(model) {
  const data = model.tasks.find((d) => d.task.id === 'json-parsing/standard-documents') ?? model.tasks.find((d) => d.runtimes.some((r) => r.entries.length)) ?? model.tasks[0]
  const plain = (e) => !e.builtin && !e.reference && e.grades.cpu?.class && !e.package.includes('/') && e.name === e.package
  const runtime = data.runtimes.find((r) => r.id === 'node' && r.entries.some(plain)) ?? data.runtimes.find((r) => r.entries.some(plain)) ?? data.runtimes.find((r) => r.entries.length)
  const entry = runtime.entries.find((e) => plain(e) && e.ecosystem === 'npm' && e.grades.types) ?? runtime.entries.find(plain) ?? runtime.entries[0]
  const pkg = model.packageOf(entry)
  const [category, task] = data.task.id.split('/')
  const address = resultPath(data.task.id, runtime.id, entry)
  const adapterId = adapterIdOf(entry)
  const groups = model.catalog?.groups ?? []
  const listed = Object.values(model.catalog?.byEcosystem ?? {}).flat()
  return {
    data, runtime, entry, pkg, category, task, address, adapterId,
    categoryOf: model.categories.find((c) => c.id === data.task.category),
    registry: entry.ecosystem,
    // The entry's id without its registry, as labels and embeds name it.
    entryName: entry.id.slice(entry.ecosystem.length + 1),
    // The same with its version, as a result's own page names it.
    result: address.slice(`/results/${data.task.id}/${runtime.id}/${entry.ecosystem}/`.length, -1),
    adapter: adapterId.slice(adapterId.indexOf('/') + 1),
    version: versionsOf(pkg)[0] ?? entry.version,
    group: groups.find((g) => model.catalog.categories.some((c) => c.group === g.id)) ?? groups[0],
    scope: model.categories.length > 1 ? 'all' : data.task.category,
    code: shortCodes.get(address),
    // For the notes on names: a scoped package, a Go module under its short
    // name, and a Go module that is listed by its path.
    scoped: model.packages.find((p) => p.ecosystem === 'npm' && p.name.startsWith('@')),
    goMeasured: model.packages.find((p) => p.ecosystem === 'gomod' && p.module && p.module !== p.name),
    goListed: listed.find((item) => item.ecosystem === 'gomod' && !item.measured && item.name.split('/').length > 2),
    listedCategory: (model.catalog?.categories ?? []).find((c) => !model.categories.some((m) => m.taxonomy === c.id) && model.catalog.byCategory.get(c.id)?.length),
  }
}

// What the Markdown, CSV and JSON exports need (see scripts/build-site.mjs).
function contextOf(model) {
  const site = (model.site?.url ?? '').replace(/\/$/, '')
  const medals = new Map()
  return { url: (to) => `${site}${to}`, model, ecosystems: ECOSYSTEMS, runtimeScores, statusOf, categoryHref, catalogUrl, allKnownPackages, eventMedals: (data) => medals.get(data) ?? medals.set(data, eventMedals(data)).get(data), runtimeMedals }
}

// --- Samples: a real response, cut down to what shows its shape ----------------

const MORE = '…'
// The named fields of an object, then `extra` (fields that are cut down in
// their turn), and last a line that says how many are left out.
function pick(object, keys, extra = {}, [one, many] = ['field', 'fields']) {
  const kept = { ...Object.fromEntries(keys.filter((key) => object[key] !== undefined).map((key) => [key, object[key]])), ...extra }
  const rest = Object.keys(object).filter((key) => !(key in kept)).length
  return rest > 0 ? { ...kept, [MORE]: `${rest} more ${rest === 1 ? one : many}` } : kept
}
// The first items of a list, and a line that says how many are left out.
const first = (list, count = 1, map = (item) => item, total = list.length) => [...list.slice(0, count).map(map), ...(total > count ? [`${MORE} ${total - count} more`] : [])]
const isNote = (value) => typeof value === 'string' && value.startsWith(`${MORE} `)
// JSON as text: a list of plain values on one line, and each note about what
// is left out on a line of its own.
function jsonSample(value, indent = '') {
  const inner = `${indent}  `
  if (Array.isArray(value)) {
    if (!value.some((item) => isNote(item) || (item && typeof item === 'object'))) return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`
    return `[\n${value.map((item) => `${inner}${isNote(item) ? item : jsonSample(item, inner)}`).join(',\n')}\n${indent}]`
  }
  if (value && typeof value === 'object') {
    const lines = Object.entries(value).map(([key, item]) => (key === MORE ? `${inner}${MORE} ${item}` : `${inner}${JSON.stringify(key)}: ${jsonSample(item, inner)}`))
    return lines.length ? `{\n${lines.join(',\n')}\n${indent}}` : '{}'
  }
  return JSON.stringify(value)
}
const shorten = (text, length = 96) => (typeof text === 'string' && text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, '')} …` : text)
const ROW_KEYS = ['task', 'ecosystem', 'package', 'version', 'runtime', 'cpu_ms', 'cpu_per', 'cpu_class', 'cpu_times_best', 'memory_bytes', 'memory_class', 'type_check_cost_mb_s', 'type_check_class']
const rowsSample = (rows, keys, total = rows?.length) => (rows?.length ? jsonSample(first(rows, 1, (row) => pick(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, shorten(v)])), keys), total)) : undefined)
// A CSV file's heading and first row: its first columns only, long cells cut.
function csvSample(rows, columns = 7) {
  // Result rows start with ten columns of names, so a few more are shown to reach the figures.
  if (rows?.[0] && 'cpu_ms' in rows[0]) columns = 15
  if (!rows?.length) return undefined
  const keys = Object.keys(rows[0])
  const [head, line] = exportsOf.toCsv([Object.fromEntries(keys.slice(0, columns).map((key) => [key, shorten(rows[0][key], 44)]))]).trimEnd().split('\n')
  const more = keys.length > columns ? `,${MORE}` : ''
  return `${head}${more}\n${line}${more}\n${MORE} ${rows.length - 1} more ${rows.length === 2 ? 'row' : 'rows'}, ${keys.length} columns in all`
}
// The first lines of a Markdown file.
const markdownSample = (text, lines = 5) => (text ? `${text.split('\n').filter((line, at, all) => line || all[at - 1]).slice(0, lines).map((line) => shorten(line, 150)).join('\n')}\n${MORE}` : undefined)

function taskDataSample(data, runtime, entry) {
  return jsonSample(pick(data, ['generatedAt'], {
    task: pick(data.task, ['id', 'title', 'kind', 'cpuPer']),
    metrics: { cpu: pick(data.metrics.cpu, ['displayUnit', 'headline', 'scale', 'floor', 'anchor']), [MORE]: 'memory, in the same form' },
    runtimes: first([runtime], 1, (r) => pick(r, ['id', 'title', 'version'], {
      entries: first([entry, ...r.entries.filter((e) => e !== entry)], 1, (e) => pick(e, ['id', 'ecosystem', 'package', 'version'], {
        metrics: pick(e.metrics, ['cpuMs', 'memoryBytes', 'totalMemoryBytes', 'peakMemoryBytes']),
        grades: e.grades,
      })),
    }), data.runtimes.length),
  }))
}

// --- Schemas: what the JSON files hold, with the unit of every figure -----------

const S = {
  string: (description, more = {}) => ({ type: 'string', description, ...more }),
  number: (description, more = {}) => ({ type: 'number', description, ...more }),
  integer: (description, more = {}) => ({ type: 'integer', description, ...more }),
  boolean: (description, more = {}) => ({ type: 'boolean', description, ...more }),
  // A figure that is missing when it could not be measured.
  maybe: (type, description, more = {}) => ({ type: [type, 'null'], description, ...more }),
  // A CSV-like cell: the value, or an empty string when there is none.
  orEmpty: (type, description) => ({ type: [type, 'string'], description: `${description} An empty string when there is none.` }),
  ref: (name) => ({ $ref: `#/components/schemas/${name}` }),
  list: (items, description) => ({ type: 'array', ...(description ? { description } : {}), items }),
  object: (description, properties, more = {}) => ({ type: 'object', description, properties, ...more }),
}
const CLASS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
// Where the product in a type-check cost uses another megabyte than the bytes do.
const classCell = (what) => ({ type: 'string', enum: [...CLASS, ''], description: `Class for ${what}, from A (best) to G. An empty string when the entry has no class.` })
const medalCell = (what) => ({ type: 'string', enum: ['gold', 'silver', 'bronze', ''], description: `Medal in the task's ${what} event, among the entries on all runtimes. An empty string for none.` })

function schemasOf(model) {
  const registries = Object.keys(ECOSYSTEMS)
  const runtimes = model.runtimes.map((rt) => rt.id)
  const scale = (unit) => S.list({ type: 'number' }, `The six class boundaries, as multiples of the best ${unit}: at or below the first is A, above the last is G.`)
  const anchor = (unit) => S.object('The best result, which every other one is divided by.', {
    id: S.string('Entry id, `<registry>/<name>`.'),
    title: S.string('Name of the entry.'),
    version: S.maybe('string', 'Its version; null for a built-in.'),
    runtime: S.string('Title of the runtime it ran on.'),
    value: S.number(`Its figure, in ${unit}.`),
  })
  const grade = (unit) => ({
    ...S.ref('Grade'),
    description: `Class, multiple of the best, and the figure in ${unit}.`,
  })
  return {
    Index: S.object('The tasks and categories that have results, and where each task\'s data file is.', {
      generatedAt: S.string('When the data was built.', { format: 'date-time' }),
      compilers: S.object('Versions of the TypeScript compilers used for type-check cost, by name.', {}, { additionalProperties: { type: 'string' } }),
      categories: S.list(S.object('A measured category.', {
        id: S.string('Category id, the first segment of its addresses.'),
        title: S.string('Name of the category.'),
        summary: S.string('What its packages do.'),
        taxonomy: S.string('Id of the same category in the catalog of listed packages.'),
      }, { required: ['id', 'title', 'summary'] }), 'Categories with at least one measured task.'),
      tasks: S.list(S.object('A measured task.', {
        id: S.string('Task id, `<category>/<task>`.'),
        category: S.string('Category id.'),
        title: S.string('Name of the task.'),
        summary: S.string('What every entry does in it.'),
        data: S.string('Address of the task\'s data file, relative to the site root, without the leading slash.'),
      }, { required: ['id', 'category', 'title', 'summary', 'data'] }), 'Every measured task.'),
      planned: S.list(S.object('A category that has a candidate task and no results yet.', {
        id: S.string('Category id.'),
        title: S.string('Name of the category.'),
        description: S.string('What its packages do.'),
        benchmarkIdea: S.string('The candidate task.'),
        packages: S.integer('Number of listed packages in it.'),
      }), 'Categories not measured yet.'),
      typeAnchors: S.object('For each category id, the package with the lowest type-check cost, which type-check classes compare with.', {}, {
        additionalProperties: S.object('The lowest-cost package of a category.', {
          title: S.string('Name of the package.'),
          version: S.string('Its version.'),
          tool: S.string('The type checker and its version.'),
          value: S.number('Its type-check cost, in MB·s.'),
        }),
      }),
      typeScale: scale('type-check cost'),
      typeFloor: S.number('Type-check cost below this counts as this, in MB·s.'),
    }, { required: ['generatedAt', 'categories', 'tasks'] }),

    TaskData: S.object('Everything measured in one task: the scales, and every entry on every runtime.', {
      generatedAt: S.string('When the data was built.', { format: 'date-time' }),
      machine: S.object('The machine that ran the task.', {
        os: S.string('Operating system and its version.'),
        arch: S.string('Processor architecture.'),
        cpu: S.string('Processor model.'),
        cores: S.integer('Number of cores.'),
      }),
      task: S.ref('Task'),
      reference: S.string('Id of the runtime whose do-nothing adapter is the reference.'),
      metrics: S.object('How CPU and memory are graded in this task.', { cpu: S.ref('Metric'), memory: S.ref('Metric') }, { required: ['cpu', 'memory'] }),
      runtimeMetrics: S.object('How the memory of the whole process is graded, for comparing runtimes.', { memory: S.ref('Metric') }),
      typeChecks: S.object('How type-check cost is graded, for each type checker: `typescript`, `python`, `ruby`, `go`, `cargo`.', {}, { additionalProperties: S.ref('TypeCheckMetric') }),
      compilers: S.object('Versions of the TypeScript compilers, by name.', {}, { additionalProperties: { type: 'string' } }),
      typesCompiler: S.string('The TypeScript compiler whose figures give the class.'),
      runtimes: S.list(S.ref('Runtime'), 'Each runtime the task ran on, with its entries.'),
    }, { required: ['generatedAt', 'machine', 'task', 'metrics', 'runtimes'] }),

    Task: S.object('A task: one job that every package of a category does the same way.', {
      id: S.string('Task id, `<category>/<task>`.'),
      category: S.string('Category id.'),
      task: S.string('The task\'s own name, the second segment of its id.'),
      title: S.string('Name of the task.'),
      summary: S.string('What every entry does in it.'),
      notes: S.string('Rules of the task in more detail.'),
      kind: S.string('What one unit of work is.', { enum: ['sync-operation', 'async-operation', 'client', 'http-server', 'server-startup'] }),
      ecosystems: S.list({ type: 'string', enum: registries }, 'Registries the task has adapters for.'),
      load: S.object('Load settings: warm-up, rounds, operations or requests in a round, and so on. The fields depend on the kind of task.', {}, { additionalProperties: { type: 'number' } }),
      cpuPer: S.string('The unit of work that CPU time is counted for in this task.', { enum: ['operation', 'request', 'start'] }),
      metrics: S.object('The task\'s own settings for CPU and memory, as its `task.json` gives them: the graded field of an entry\'s `metrics` (`key`: `cpuMs` or `memoryBytes`), the unit and the words a person reads (`displayUnit`, `headline`), and where set a `floor` in ms or bytes and a `scale`.', {}, { additionalProperties: { type: 'object' } }),
      fixtureCount: S.integer('Number of inputs.'),
      strictness: S.string('For a task of a pair that differ in how strict the check is.', { enum: ['strict', 'lenient'] }),
      pairedWith: S.string('Id of the other task of the pair.'),
      adaptersFrom: S.string('Id of the task whose adapters this one runs.'),
    }, { required: ['id', 'category', 'task', 'title', 'summary', 'kind'] }),

    Metric: S.object('One graded measure of a task. Its figures are in ms for CPU and in bytes for memory; the scale is in multiples of the best and has no unit.', {
      displayUnit: S.string('The unit the pages and labels show this measure in: `µs` or `ms` for CPU, `MB` for memory. The figures in the data are not in it.'),
      headline: S.string('What the pages show, in words, for example "µs of CPU per operation".'),
      scale: scale('result'),
      floor: S.number('A figure below this counts as this: in ms for CPU, in bytes for memory.'),
      anchor: anchor('ms for CPU, in bytes for memory'),
    }, { required: ['displayUnit', 'scale'] }),

    TypeCheckMetric: S.object('How type-check cost is graded for one type checker.', {
      displayUnit: S.string('Always `MB·s`, which is also the unit of the figures: added compiler CPU time in seconds multiplied by added compiler memory in MB (of 1,000,000 bytes).'),
      headline: S.string('The unit in words.'),
      absolute: S.boolean('Whether classes come from fixed costs and not from multiples of the best.'),
      scale: scale('cost in the category'),
      floor: S.number('A cost below this counts as this, in MB·s.'),
      timeFloorMs: S.object('Compiler CPU time below this counts as this, in ms, for each compiler.', {}, { additionalProperties: { type: 'number' } }),
      tool: S.string('The type checker and its version.'),
      notes: S.string('What is checked.'),
      anchor: S.object('The lowest-cost package of the category, which the others are divided by.', {
        title: S.string('Name of the package.'),
        version: S.string('Its version.'),
        tool: S.string('The type checker and its version.'),
        value: S.number('Its cost, in MB·s.'),
        category: S.string('Title of the category.'),
      }),
    }, { required: ['displayUnit', 'scale'] }),

    Runtime: S.object('A runtime in one task.', {
      id: S.string('Runtime id.', { enum: runtimes }),
      title: S.string('Name of the runtime.'),
      version: S.string('Version that ran.'),
      language: S.string('Language of its adapters.'),
      garbageCollected: S.boolean('Whether the runtime has a garbage collector.'),
      heapDescription: S.string('What the runtime reports as its heap.'),
      baselineHeapBytes: S.maybe('integer', 'Heap of the do-nothing adapter, in bytes.'),
      baselineBytes: S.integer('Memory of the do-nothing adapter on the same inputs, in bytes.'),
      entries: S.list(S.ref('Entry'), 'The results that are ranked: each entry at its current version.'),
      history: S.list(S.ref('Entry'), 'Results kept for earlier versions.'),
      unsupported: S.list(S.object('An entry with no result on this runtime.', {
        id: S.string('Entry id.'),
        package: S.string('Package name.'),
        ecosystem: S.string('Registry id.'),
        version: S.string('Version that was tried.'),
        title: S.string('Name of the entry.'),
        status: S.string('Why there is no result.', { enum: ['unsupported', 'failed', 'verify-failed'] }),
        notes: S.maybe('string', 'The reason in words.'),
        error: S.string('The error text.'),
      }), 'Entries that do not run here, or whose output was wrong.'),
    }, { required: ['id', 'title', 'version', 'entries'] }),

    Entry: S.object('One result: a package, or a variant of it, at one version on one runtime.', {
      id: S.string('Entry id, `<registry>/<name>`. A variant of a package has a name of its own.'),
      ecosystem: S.string('Registry id.', { enum: registries }),
      name: S.string('The entry\'s name: the package, or the variant.'),
      package: S.string('The package it measures, as its registry names it. A Go module has a short name here and its path in `module`.'),
      module: S.string('For a Go module, its module path.'),
      title: S.string('Name shown for the entry.'),
      version: S.maybe('string', 'Version measured; null for a built-in.'),
      defaultVersion: S.maybe('string', 'Version the package is ranked at.'),
      activeRelease: S.boolean('Whether this version is the one ranked.'),
      builtin: S.boolean('Whether it is part of the runtime and not a package.'),
      reference: S.boolean('True for a reference entry, which is shown for comparison and has no class.'),
      flags: S.list({ type: 'string' }, 'Remarks from the measurement, for example `grows-with-use`.'),
      metrics: S.ref('EntryMetrics'),
      grades: S.object('The entry\'s class in each measure.', {
        cpu: grade('ms of CPU for one unit of work'),
        memory: grade('bytes'),
        types: grade('MB·s'),
      }, { required: ['cpu', 'memory'] }),
      runtimeGrades: S.object('Classes for comparing runtimes.', { memory: grade('bytes of the whole process after the task and a garbage collection') }),
      types: {
        type: ['object', 'null'],
        description: 'The type-check measurement: what the package adds to a check, and for a package measured by a sweep of its registry (`swept`) also what its adapter adds (`adapter`). Null when nothing was checked.',
        properties: {
          costMbS: S.maybe('number', 'Type-check cost, in MB·s: `cpuMs / 1000 * memoryBytes / 1e6`, after the minimums: CPU time below 10 ms counts as 10 ms, and memory below 0.25 MB as 0.25 MB (5 MB for a Go module measured by a sweep).'),
          cpuMs: S.number('Added compiler CPU time, in ms, before the minimum.'),
          memoryBytes: S.integer('Added compiler memory, in bytes, before the minimum.'),
          timeMs: S.number('Added elapsed time of the type checker, in ms.'),
          coldCpuMs: S.number('For a Rust adapter, CPU time of a first check of the crate and its dependencies, in ms.'),
          swept: S.boolean('True when the figures are of the whole package, from a sweep of its registry, and not of the adapter.'),
          adapter: { type: ['object', 'null'], description: 'Where `swept` is true, what the adapter adds: `cpuMs`, `memoryBytes` and `costMbS`.' },
          tool: S.string('The type checker.'),
          from: S.string('Where the types come from: `bundled` with the package, or the package that has them.'),
          community: S.boolean('True when other people than the package\'s authors wrote the types.'),
          compilers: S.object('For TypeScript, the figures of each compiler, by name: `cpuMs`, `timeMs`, `memoryBytes`, `costMbS`, `class` and `ratio`. The entry\'s own `costMbS` is that of the task\'s `typesCompiler`.', {}, { additionalProperties: { type: ['object', 'null'] } }),
        },
      },
      measurement: S.object('How many times it ran.', {
        runs: S.integer('Number of runs.'),
        roundsPerRun: S.list({ type: 'integer' }, 'Measured rounds in each run.'),
        warmupRoundsPerRun: S.list({ type: 'integer' }, 'Warm-up rounds in each run.'),
        harness: S.integer('Version of the harness.'),
      }),
      adapter: S.object('The benchmark adapter: the code that runs the package in the task.', {
        author: S.object('Who wrote it.', {
          kind: S.string('`agent` or `human`.'),
          agent: S.string('The coding agent.'),
          model: S.string('The model it used.'),
          date: S.string('Day it was written.', { format: 'date' }),
        }),
        review: S.string('`unreviewed` until a person has reviewed it.'),
        reviewed: { description: 'The review, when there is one; otherwise null.' },
        tags: S.list({ type: 'string' }, 'Remarks on how the entry differs, for example `non-default-options`.'),
        notes: S.maybe('string', 'What the adapter does, in words.'),
        details: S.string('How the package was installed or set up.'),
        runtimeNotes: S.object('Notes for one runtime, by runtime id.', {}, { additionalProperties: { type: 'string' } }),
        dependencies: S.list({ type: 'string' }, 'Other packages installed with it, as `name@version`.'),
        strict: S.object('In a lenient task: the strict task of the pair, and whether the entry passes it.', { task: S.string('Task id.'), passes: S.boolean('Whether it passes.') }),
      }),
    }, { required: ['id', 'ecosystem', 'name', 'package', 'title', 'version', 'metrics', 'grades'] }),

    EntryMetrics: S.object('The figures of one result: every time in milliseconds and every memory figure in bytes, whatever the task. Each is the median of the rounds of a run, then of the runs, rounded as the pages show it (a memory figure to a tenth of a megabyte of 1,000,000 bytes).', {
      cpuMs: S.number('CPU time for one unit of work, in ms: user and system time, all threads. The task\'s `cpuPer` says whether that is an operation, a request or a start. An operation of 23.6 µs is 0.0236.'),
      startupMs: S.number('In a startup task, elapsed time to the first page, in ms.'),
      perCpuSecond: S.integer('Units of work per second of CPU time.'),
      memoryBytes: S.integer('Memory the process holds after the task and a garbage collection, above the do-nothing adapter, in bytes. Never below 0. This is the graded figure.'),
      memoryAboveBaselineBytes: S.integer('The same, and negative when the entry holds less than the do-nothing adapter.'),
      totalMemoryBytes: S.integer('All the memory the process holds after the task and a garbage collection, in bytes.'),
      memoryKind: S.string('What the memory figures count.', { enum: ['footprint', 'rss'] }),
      peakMemoryBytes: S.integer('Highest resident size during the run, in bytes.'),
      heapPeakBytes: S.maybe('integer', 'Highest heap the runtime reported, in bytes.'),
      heapRetainedBytes: S.maybe('integer', 'Heap still held after the last round, above the heap when the adapter was ready, in bytes.'),
      heapAboveBaselineBytes: S.maybe('integer', 'Heap after the last round, above the do-nothing adapter, in bytes.'),
      leakBytesPerUnit: S.maybe('number', 'Heap growth from the first round to the last, in bytes for one unit of work.'),
      importMs: S.maybe('number', 'Time to load the package, in ms.'),
      installBytes: S.maybe('integer', 'Size on disk once installed, in bytes; for Rust, what the crate adds to the compiled binary.'),
      installPackages: S.maybe('integer', 'Number of packages installed with it, itself included.'),
      installKind: S.maybe('string', '`install` for a size on disk, `binary` for a size added to a binary.'),
      throughputPerSecond: S.integer('Units of work per second of elapsed time.'),
      latencyP50Ms: S.maybe('number', 'Median latency, in ms.'),
      latencyP99Ms: S.maybe('number', '99th percentile of latency, in ms.'),
    }, { required: ['cpuMs', 'memoryBytes', 'totalMemoryBytes', 'peakMemoryBytes'] }),

    Grade: S.object('A class in one measure.', {
      class: { type: ['string', 'null'], enum: [...CLASS, null], description: 'Class from A (best) to G. Null for a reference entry.' },
      ratio: S.number('Multiple of the best result: 1 is the best, 2 costs twice as much.'),
      value: S.number('The graded figure: ms for CPU, bytes for memory, MB·s for type-check cost.'),
      reference: S.boolean('True for a reference entry, which has no class.'),
      overhead: S.object('For a framework, its multiple of the same runtime\'s server without a framework.', { ratio: S.number('Multiple of that server.'), title: S.string('Name of that server.') }),
    }, { required: ['class', 'ratio'] }),

    ResultRow: S.object('One result as a flat row: an entry on one runtime in one task. Every time is in milliseconds and every memory figure in bytes, whatever the task, and each field\'s name ends in its unit. The CSV files have the same columns in the same order.', {
      category: S.string('Category id.'),
      task: S.string('Task id, `<category>/<task>`.'),
      ecosystem: S.string('Registry id.', { enum: registries }),
      package: S.string('Package name.'),
      entry: S.string('Name of the entry: the package, or a variant of it.'),
      version: S.string('Version measured. An empty string for a built-in.'),
      settings: S.string('`default` for the package as installed, `tuned` for documented settings that are not the default, `built in` for a part of the runtime.', { enum: ['default', 'tuned', 'built in'] }),
      language: S.string('Language of the adapter.'),
      runtime: S.string('Title of the runtime.'),
      runtime_version: S.string('Version of the runtime.'),
      cpu_ms: S.number('CPU time for one unit of work, in ms, whatever the task: user and system time, all threads. An operation of 23.6 µs is 0.0236.'),
      cpu_per: S.string('The unit of work that `cpu_ms` is for.', { enum: ['operation', 'request', 'start'] }),
      cpu_class: classCell('CPU'),
      cpu_times_best: S.orEmpty('number', 'CPU time as a multiple of the best result in the task.'),
      memory_bytes: S.integer('Memory held after the task and a garbage collection, above the do-nothing adapter, in bytes.'),
      memory_class: classCell('memory'),
      memory_times_best: S.orEmpty('number', 'Memory as a multiple of the best result in the task.'),
      type_check_cost_mb_s: S.orEmpty('number', `Type-check cost, in MB·s: \`type_check_cpu_ms / 1000 * type_check_memory_bytes / 1e6\`, after the minimums: CPU time below 10 ms counts as 10 ms, and memory below 0.25 MB as 0.25 MB (5 MB for a Go module).`),
      type_check_cpu_ms: S.orEmpty('number', 'CPU time the package adds to a type check, in ms, before the minimum.'),
      type_check_memory_bytes: S.orEmpty('integer', 'Memory the package adds to a type check, in bytes, before the minimum.'),
      type_check_class: classCell('type-check cost'),
      type_check_times_best: S.orEmpty('number', 'Type-check cost as a multiple of the lowest-cost package in the category.'),
      total_memory_bytes: S.integer('All the memory the process holds after the task and a garbage collection, in bytes.'),
      peak_memory_bytes: S.integer('Highest resident size during the run, in bytes.'),
      heap_retained_bytes: S.maybe('integer', 'Heap still held after the last round, in bytes.'),
      import_ms: S.maybe('number', 'Time to load the package, in ms.'),
      install_bytes: S.maybe('integer', 'Size on disk once installed, in bytes; for Rust, what the crate adds to the binary.'),
      install_packages: S.maybe('integer', 'Number of packages installed with it, itself included.'),
      install_kind: S.maybe('string', '`install` or `binary`.'),
      per_cpu_second: S.number('Operations or requests per second of CPU time.'),
      throughput_per_second: S.number('Operations or requests per second of elapsed time.'),
      latency_p99_ms: S.maybe('number', '99th percentile of latency, in ms.'),
      benchmark_source: S.string('Folder of the adapter in the repository.'),
      cpu_medal: medalCell('CPU'),
      memory_medal: medalCell('memory'),
      type_check_medal: medalCell('type-check'),
      registry_rank: S.orEmpty('integer', 'Rank of the package in its registry by use.'),
      use: S.orEmpty('number', 'Use of the package, counted as `use_measure` says.'),
      use_measure: S.string('What `use` counts, for example "downloads per month".'),
    }, { required: ['category', 'task', 'ecosystem', 'package', 'entry', 'runtime', 'cpu_ms', 'cpu_per', 'memory_bytes', 'total_memory_bytes', 'peak_memory_bytes'] }),

    CatalogRow: S.object('One listed package, measured or not.', {
      ecosystem: S.string('Title of the registry, for example "crates.io".'),
      package: S.string('Package name, as its registry names it.'),
      rank: S.orEmpty('integer', 'Rank in its registry by use.'),
      use: S.orEmpty('number', 'Use of the package, counted as `use_measure` says.'),
      use_measure: S.string('What `use` counts: downloads per month, downloads in total, downloads in the last 90 days, or repositories that depend on it.'),
      share_of_registry: S.number('Part of the listed use of its registry that goes to this package, from 0 to 1.'),
      category: S.string('Title of its category. An empty string when it has none.'),
      status: S.string('Whether it has results.', { enum: ['Measured', 'Benchmark not run yet', 'No benchmark yet', 'No comparable task'] }),
      best_cpu_class: classCell('CPU, the best on any runtime and in any task'),
      best_memory_class: classCell('memory, the best on any runtime and in any task'),
      latest_version: S.string('Latest version listed.'),
      registry: S.string('Address of the package in its registry.'),
      repository: S.string('Address of its source repository.'),
      page: S.string('Address of its page on this site.'),
    }, { required: ['ecosystem', 'package', 'status', 'page'] }),

    CategoryRow: S.object('One category of the catalog.', {
      group: S.string('Title of its group.'),
      category: S.string('Title of the category.'),
      status: S.string('Whether it has results.', { enum: ['Measured', 'No benchmark yet', 'No comparable task'] }),
      tasks: S.string('Titles of its measured tasks, separated by "; ".'),
      listed_packages: S.integer('Number of listed packages in it.'),
      measured_packages: S.integer('How many of them have results.'),
      share_of_use: S.number('Part of the listed use that goes to its packages, from 0 to 1: the mean over the registries.'),
      description: S.string('What its packages do.'),
      candidate_task: S.string('For a category not measured yet, the task that could measure it.'),
      page: S.string('Address of its page on this site.'),
    }, { required: ['group', 'category', 'status', 'page'] }),

    TaskRow: S.object('One measured task.', {
      category: S.string('Title of its category.'),
      task: S.string('Title of the task.'),
      summary: S.string('What every entry does in it.'),
      entries: S.integer('Number of entries, counted once across runtimes.'),
      runtimes: S.string('Titles of the runtimes with a result, separated by "; ".'),
      page: S.string('Address of its page.'),
      markdown: S.string('Address of its Markdown file.'),
      csv: S.string('Address of its CSV file.'),
      source: S.string('Address of its benchmark source in the repository.'),
    }, { required: ['category', 'task', 'page'] }),

    RuntimeScoreRow: S.object('One runtime in one scope: all categories, or one category.', {
      scope: S.string('"All categories", "All tasks", or the title of a category.'),
      runtime: S.string('Title of the runtime.'),
      version: S.string('Version of the runtime.'),
      gold: S.integer('Gold medals won by entries on it.'),
      silver: S.integer('Silver medals.'),
      bronze: S.integer('Bronze medals.'),
      entries: S.integer('Number of entries on it.'),
      tasks: S.integer('Number of tasks it ran.'),
      cpu_best_times: S.orEmpty('number', 'CPU time of its best entry, as a multiple of the best result in any language.'),
      cpu_best_class: classCell('CPU, of its best entry'),
      cpu_typical_times: S.orEmpty('number', 'Geometric mean of the CPU multiples of all its entries.'),
      memory_best_times: S.orEmpty('number', 'Memory of the whole process for its best entry, as a multiple of the best.'),
      memory_best_class: classCell('memory, of its best entry'),
      memory_typical_times: S.orEmpty('number', 'Geometric mean of the memory multiples of all its entries.'),
      type_check_best_times: S.orEmpty('number', 'Type-check cost of its best entry, as a multiple of the best.'),
      type_check_best_class: classCell('type-check cost, of its best entry'),
    }, { required: ['scope', 'runtime', 'version', 'gold', 'silver', 'bronze'] }),

    Catalog: S.object('The listed packages that have no results, packed for the site\'s package table. The measured ones are in the result files.', {
      registries: S.object('For each registry id, its title and what its use counts.', {}, {
        additionalProperties: S.object('A registry.', { title: S.string('Name of the registry.'), measure: S.string('What use counts there, for example "downloads per month".') }),
      }),
      packages: S.list({
        type: 'array',
        description: 'One package, as a list of nine values in this order: registry id, name, latest version, use, share of the registry\'s listed use (0 to 1), title of its category, address of the category page, rank in its registry (null for a package added by hand), status.',
        minItems: 9,
        maxItems: 9,
        prefixItems: [{ type: 'string' }, { type: 'string' }, { type: 'string' }, { type: 'number' }, { type: 'number' }, { type: 'string' }, { type: 'string' }, { type: ['integer', 'null'] }, { type: 'string' }],
      }, 'Packages without results, the most used first.'),
    }, { required: ['registries', 'packages'] }),

    SearchIndex: S.list(S.object('One thing the search box can find.', {
      t: S.string('Its name.'),
      k: S.string('Its kind in words: a registry\'s title for a package, or "Task", "Category", "Ecosystem", "Runtime".'),
      i: S.string('Name of its icon.'),
      u: S.string('Address of its page, from the site root.'),
      r: S.maybe('integer', 'For a package, its rank in its registry; null for one added by hand.'),
      a: S.list({ type: 'string' }, 'For a category, other names it is searched by.'),
    }, { required: ['t', 'k', 'u'] }), 'Every page the search box can find: packages, tasks, categories, registries and runtimes. The site\'s own script reads this file, and its fields can change with the site.'),
  }
}

// --- The description ------------------------------------------------------------

const TAGS = [
  ['Catalog', 'What the site holds: the index of tasks and categories, the listed packages without results, and the lists made for search and for language models.'],
  ['Tasks', 'A task is one job that every package of a category does the same way. Its data file has every measurement; the CSV and Markdown files have the figures a page shows.'],
  ['Categories', 'A category is a group of packages that can do the same job. Categories are sorted into groups.'],
  ['Packages', 'Packages by registry. A measured package has its results in every form; a package that is listed and not measured has a Markdown page only.'],
  ['Results', 'Every result in one file, and each result at an address of its own that does not change when a newer version is measured.'],
  ['Runtimes', 'Runtimes compared across tasks, and the results of one runtime.'],
  ['Labels and embeds', 'Labels as SVG images, in several shapes, for a result, for a package\'s best result in a task, and for a runtime\'s summary.'],
]
// What each named schema is, in a few words: its `title`, and how the page
// names its fields ("Fields of a result row").
const SCHEMA_TITLES = {
  Index: 'the index', TaskData: 'a task\'s data file', Task: 'a task', Metric: 'a graded measure', TypeCheckMetric: 'a type-check measure', Runtime: 'a runtime in a task', Entry: 'an entry',
  EntryMetrics: 'an entry\'s figures', Grade: 'a class', ResultRow: 'a result row', CatalogRow: 'a listed package',
  CategoryRow: 'a category row', TaskRow: 'a task row', RuntimeScoreRow: 'a runtime row', Catalog: 'the catalog file', SearchIndex: 'a search item',
}
const MEDIA = { json: 'application/json', csv: 'text/csv', md: 'text/markdown', svg: 'image/svg+xml', text: 'text/plain' }
// The name of each format, as the page's chooser and `x-format` have it.
const FORMATS = { json: 'JSON', csv: 'CSV', md: 'Markdown', svg: 'SVG', text: 'Text', redirect: 'Redirect' }
const slug = (text) => text.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const EMBED_SHAPES = 'The shapes: `overview.svg` (all measures on one label), `badge.svg` (one line; `badge.flat.svg` without shading), `badge.<measure>.svg` and `badge.<measure>.flat.svg`, `button.<measure>.svg`, `compact.<measure>.svg` and `wide.<measure>.svg`. A shape for `types` exists only when the entry has a type-check class.'

/**
 * The OpenAPI 3.1 description of the site's files.
 * Reads from `model`: `site.url`, `index` (generatedAt, and as the
 * sample of /data/index.json), `tasks`, `categories`, `packages`, `runtimes`,
 * `packageOf`, `repository`, and `catalog` (groups, categories, byEcosystem,
 * byCategory, categoryShare, aliases).
 */
export function openApiSpec(model) {
  const ex = examplesOf(model)
  const ctx = contextOf(model)
  const site = siteOf(model)
  const measures = Object.keys(RANKINGS)
  const registries = Object.keys(ECOSYSTEMS)
  const day = String(model.index.generatedAt).slice(0, 10)
  const shapes = ['overview.svg', 'badge.svg', 'badge.flat.svg', ...measures.flatMap((m) => [`badge.${m}.svg`, `badge.${m}.flat.svg`]), ...['button', 'compact', 'wide'].flatMap((shape) => measures.map((m) => `${shape}.${m}.svg`))]
  const id = { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }
  const param = (name, description, schema, example, more = {}) => ({ name, in: 'path', required: true, description, schema, example, ...more })
  // A few real values of a parameter, for the try box of the page (`x-suggestions`).
  const some = (values, example) => ({ 'x-suggestions': [...new Set([example, ...values])].filter((value) => value !== undefined && value !== null).slice(0, 12) })
  const inTask = [...new Set(ex.data.runtimes.flatMap((r) => r.entries))]
  const sameRegistry = inTask.filter((e) => e.ecosystem === ex.registry)
  // A name with slashes takes several segments of the address; OpenAPI has no
  // word for that, so such a parameter is marked.
  const spans = { 'x-multi-segment': true }

  const parameters = {
    category: param('category', 'Category id, as in `/data/index.json`.', id, ex.category, { 'x-suggestions': model.categories.map((c) => c.id) }),
    task: param('task', 'The task\'s name inside its category: the part of the task id after the slash.', id, ex.task, some(model.tasks.filter((d) => d.task.category === ex.category).map((d) => d.task.task), ex.task)),
    group: param('group', 'Id of a group of categories.', { type: 'string', enum: model.catalog.groups.map((g) => g.id) }, ex.group?.id),
    registry: param('registry', `Registry id: ${registries.map((r) => `\`${r}\` (${ECOSYSTEMS[r].title})`).join(', ')}.`, { type: 'string', enum: registries }, ex.registry),
    package: param('package', 'Package name, as its registry writes it. A scoped name (`@scope/name`) keeps its slash and takes two segments of the address. A measured Go module has a short name of its own; a Go module that is listed and not measured is named by its module path, slashes included.', { type: 'string' }, ex.pkg.name, { ...spans, ...some(sameRegistry.map((e) => e.package), ex.pkg.name) }),
    version: param('version', 'A version of the package that has results, as its registry writes it.', { type: 'string' }, ex.version, some(versionsOf(ex.pkg), ex.version)),
    runtime: param('runtime', `Runtime id: ${model.runtimes.map((rt) => `\`${rt.id}\` (${rt.title})`).join(', ')}.`, { type: 'string', enum: model.runtimes.map((rt) => rt.id) }, ex.runtime.id),
    entry: param('entry', 'The entry\'s id without its registry: the package name, or the name of a variant of it. A scoped name keeps its slash. For a result kept for an earlier version, `@` and the version follow.', { type: 'string' }, ex.entryName, { ...spans, ...some(ex.runtime.entries.filter((e) => e.ecosystem === ex.registry).map((e) => e.id.slice(e.ecosystem.length + 1)), ex.entryName) }),
    result: param('result', 'The entry\'s name, then `@` and the version measured. A built-in has no version, so its name stands alone. A scoped name keeps its slash.', { type: 'string' }, ex.result, { ...spans, ...some(ex.runtime.entries.filter((e) => e.ecosystem === ex.registry).map((e) => resultPath(ex.data.task.id, ex.runtime.id, e).slice(`/results/${ex.data.task.id}/${ex.runtime.id}/${e.ecosystem}/`.length, -1)), ex.result) }),
    adapter: param('adapter', 'The adapter\'s name in its registry\'s folder: most often the package name. A scoped name keeps its slash.', { type: 'string' }, ex.adapter, { ...spans, ...some(sameRegistry.map((e) => adapterIdOf(e)).map((id) => id.slice(id.indexOf('/') + 1)), ex.adapter) }),
    measure: param('measure', 'The measure: `cpu` (CPU time), `memory`, or `types` (type-check cost).', { type: 'string', enum: measures }, 'cpu'),
    scope: param('scope', 'What the summary covers: `all` for every category, a category id, or a task id (`<category>/<task>`, two segments) in a category with more than one task.', { type: 'string' }, ex.scope, { ...spans, ...some(['all', ex.category, ...(ex.categoryOf.tasks.length > 1 ? [ex.data.task.id] : [])], ex.scope) }),
    basis: param('basis', 'Which entry of the runtime the summary shows: its best one, or the typical one (the geometric mean of all its entries).', { type: 'string', enum: ['best', 'typical'] }, 'best'),
    file: param('file', `The shape of the label. ${EMBED_SHAPES}`, { type: 'string', enum: shapes }, 'badge.svg'),
    summaryFile: param('file', `The shape of the label: \`label.<measure>.svg\` for the full label, or one of the shapes of a result. ${EMBED_SHAPES}`, { type: 'string', enum: [...measures.map((m) => `label.${m}.svg`), ...shapes] }, 'label.cpu.svg'),
    code: param('code', 'The code printed on a label: six or more lowercase letters and digits.', { type: 'string', pattern: '^[0-9a-z]{6,40}$' }, ex.code ?? '000000'),
  }

  // Samples are real responses, worked out the way the build writes them.
  const rows = {
    task: exportsOf.resultRows(ex.data, ctx),
    category: exportsOf.categoryExport(ctx, ex.categoryOf),
    packageRows: exportsOf.resultRows(ex.data, ctx).filter((row) => row.ecosystem === ex.pkg.ecosystem && row.package === ex.pkg.name),
    registry: exportsOf.ecosystemExport(ctx, ex.registry),
    packages: exportsOf.packagesExport(ctx),
    categories: exportsOf.categoriesExport(ctx),
    group: ex.group ? exportsOf.categoriesExport(ctx, ex.group) : null,
    tasks: exportsOf.tasksExport(ctx),
    runtimes: exportsOf.runtimesExport(ctx),
    runtime: exportsOf.runtimeExport(ctx, model.runtimes.find((rt) => rt.id === ex.runtime.id)),
  }
  const CATALOG_KEYS = ['ecosystem', 'package', 'rank', 'use', 'use_measure', 'category', 'status', 'best_cpu_class', 'page']
  const CATEGORY_KEYS = ['group', 'category', 'status', 'tasks', 'listed_packages', 'measured_packages', 'share_of_use', 'page']
  const TASK_KEYS = ['category', 'task', 'entries', 'runtimes', 'page', 'csv']
  const SCORE_KEYS = ['scope', 'runtime', 'version', 'gold', 'silver', 'bronze', 'entries', 'cpu_best_times', 'cpu_best_class', 'cpu_typical_times']
  const unmeasured = Object.values(model.catalog.byEcosystem).flat().filter((item) => !item.measured)
  const mostUsed = unmeasured.reduce((best, item) => (!best || item.share > best.share ? item : best), null)
  const found = searchIndex(model)

  const paths = {}
  const used = new Set()
  const titles = new Set()
  const rowsOf = (name) => ({ type: 'array', items: { $ref: `#/components/schemas/${name}` } })
  // One thing a reader can ask for, under the title of the task it serves, and
  // the addresses that answer it: one for each format. OpenAPI has a path for
  // each address, so each operation says which entry it belongs to
  // (`x-resource`), under what title (`x-task`) and in which format
  // (`x-format`); the page puts them together again from that.
  // A variant: { path, id, format, note, schema, sample, returns, redirect, sameAs }.
  function resource(tag, title, about, variants) {
    if (titles.has(title)) throw new Error(`two entries are called ${title}`)
    titles.add(title)
    const formats = new Set(variants.filter((v) => !v.sameAs).map((v) => v.format))
    for (const { path, id: operationId, format, note, schema, rows: rowSchema, sample, returns, redirect, sameAs } of variants) {
      if (used.has(operationId)) throw new Error(`two operations are called ${operationId}`)
      used.add(operationId)
      const names = [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => name)
      const content = { ...(schema ? { schema } : format === 'json' ? {} : { schema: { type: 'string' } }), ...(rowSchema ? { 'x-rows': rowSchema } : {}), ...(sample ? { 'x-sample': sample } : {}) }
      const summary = `${title}${formats.size > 1 ? `, as ${FORMATS[format]}` : ''}.`
      paths[path] = {
        get: {
          tags: [tag],
          operationId,
          summary,
          description: [about, note].filter(Boolean).join(' '),
          'x-resource': slug(title),
          'x-task': title,
          'x-format': FORMATS[format],
          'x-about': about,
          ...(note ? { 'x-note': note } : {}),
          ...(sameAs ? { 'x-same-as': sameAs } : {}),
          ...(names.length ? { parameters: names.map((name) => ({ $ref: `#/components/parameters/${name === 'file' && path.startsWith('/embed/runtimes/') ? 'summaryFile' : name}` })) } : {}),
          responses: redirect
            ? { 308: { description: redirect, headers: { Location: { description: 'The full address of the page.', schema: { type: 'string', format: 'uri' } } } }, 404: { $ref: '#/components/responses/NotFound' } }
            : { 200: { description: returns ?? summary, content: { [MEDIA[format]]: content } }, 404: { $ref: '#/components/responses/NotFound' } },
        },
      }
    }
  }
  // The three forms of a list at one base address.
  const three = (base, name, { schema, json, csv, markdown, keys, notes = {} }) => [
    { path: `${base}results.json`, id: `${name}Json`, format: 'json', note: notes.json, schema: typeof schema === 'string' ? rowsOf(schema) : schema, sample: rowsSample(json, keys) },
    { path: `${base}results.csv`, id: `${name}Csv`, format: 'csv', note: notes.csv ?? 'The same rows as the JSON, under a heading row.', rows: typeof schema === 'string' ? rowsOf(schema) : schema, sample: csvSample(csv ?? json) },
    { path: `${base}index.md`, id: `${name}Markdown`, format: 'md', note: notes.md ?? 'The page in Markdown, with its tables.', sample: markdownSample(markdown) },
  ]

  // Catalog
  resource('Catalog', 'List the tasks and categories that have results', 'Start here: each task names its data file, and the ids fill the `{category}` and `{task}` of the other addresses.', [{
    path: '/data/index.json', id: 'getIndex', format: 'json', schema: S.ref('Index'),
    sample: jsonSample(pick(model.index, ['generatedAt'], { categories: first(model.index.categories, 1, (c) => ({ ...c, summary: shorten(c.summary) })), tasks: first(model.index.tasks, 1, (t) => ({ ...t, summary: shorten(t.summary) })) })),
  }])
  resource('Catalog', 'List the packages that are not measured yet', 'The listed packages that have no results, packed as lists of values for the site\'s package table. `/packages/results.json` has every listed package with named fields.', [{
    path: '/data/catalog.json', id: 'getCatalog', format: 'json', schema: S.ref('Catalog'),
    sample: mostUsed ? jsonSample({
      registries: pick(Object.fromEntries(Object.entries(model.catalog.byEcosystem).map(([key, items]) => [key, { title: ECOSYSTEMS[key].title, measure: items[0]?.popularity.label ?? '' }])), [mostUsed.ecosystem], {}, ['registry', 'registries']),
      // The same nine values that scripts/build-site.mjs writes for a package.
      packages: first([[mostUsed.ecosystem, mostUsed.name, mostUsed.version ?? '', mostUsed.popularity.value, Number(mostUsed.share.toPrecision(4)), mostUsed.category?.title ?? '', mostUsed.category ? categoryHref(mostUsed.category.id, model) : '', mostUsed.rank, statusOf(mostUsed)]], 1, undefined, unmeasured.length),
    }) : undefined,
  }])
  resource('Catalog', 'Search names', 'The names and addresses of every page the search box can find: packages, tasks, categories, registries and runtimes. Take the file and match the names yourself. The site\'s own script reads it, so its short field names can change with the site.', [{
    path: '/search.json', id: 'getSearchIndex', format: 'json', schema: S.ref('SearchIndex'), sample: jsonSample(first(found, 1, undefined, found.length)),
  }])
  resource('Catalog', 'Read the whole site as one text', 'A description of the site and a list of its Markdown pages, written for language models.', [
    { path: '/llms.txt', id: 'getLlmsText', format: 'text', note: 'Ends with the addresses of the data files.', sample: markdownSample(exportsOf.llmsText(model, ECOSYSTEMS, ctx), 3) },
    { path: '/index.md', id: 'getHomeMarkdown', format: 'md', note: 'The home page: the same text, ending with links to the indexes and to all results.', sample: markdownSample(exportsOf.homeExport(ctx).markdown, 3) },
  ])

  // Tasks
  resource('Tasks', 'List the tasks', 'Every measured task, with its category, how many entries it has and the runtimes it ran on.', three('/tasks/', 'getTasks', { schema: 'TaskRow', json: rows.tasks.rows, markdown: rows.tasks.markdown, keys: TASK_KEYS }))
  resource('Tasks', 'Get every result of a task', 'Every entry of one task on every runtime. The JSON is the task\'s data file: it is at an address of another shape than the CSV and the Markdown, under `/data/`, and it holds more than they do.', [
    { path: '/data/{category}/{task}.json', id: 'getTaskData', format: 'json', note: 'The file the task\'s page is drawn from: the scales and the best results that classes come from, and every entry with all its figures, its classes and its adapter\'s notes. There is no `results.json` beside the CSV.', schema: S.ref('TaskData'), sample: taskDataSample(ex.data, ex.runtime, ex.entry) },
    { path: '/{category}/{task}/results.csv', id: 'getTaskResultsCsv', format: 'csv', rows: rowsOf('ResultRow'), note: 'One flat row for each entry on each runtime, under a heading row.', sample: csvSample(rows.task) },
    { path: '/{category}/{task}/index.md', id: 'getTaskResultsMarkdown', format: 'md', note: 'The task\'s page in Markdown: a table for each runtime, then the benchmark source and every adapter.', sample: markdownSample(exportsOf.taskMarkdown(ex.data, ctx)) },
  ])
  resource('Tasks', 'Read the benchmark source of a task', 'The rules of the task, its load settings and the scenario that checks every adapter, with a list of the adapters.', [{ path: '/source/{category}/{task}/index.md', id: 'getTaskSourceMarkdown', format: 'md', sample: markdownSample(exportsOf.taskSourceExport(ctx, ex.data).markdown, 3) }])
  resource('Tasks', 'Read an adapter\'s source', 'The code that runs one package in a task, with who wrote it and its notes.', [{ path: '/source/{category}/{task}/{registry}/{adapter}/index.md', id: 'getAdapterSourceMarkdown', format: 'md', sample: markdownSample(exportsOf.adapterSourceExport(ctx, ex.data, ex.adapterId).markdown, 3) }])

  // Categories
  resource('Categories', 'List the categories', 'Every category of the catalog, measured or not, with its group, its tasks or its candidate task, and its share of use.', three('/categories/', 'getCategories', { schema: 'CategoryRow', json: rows.categories.rows, markdown: rows.categories.markdown, keys: CATEGORY_KEYS }))
  if (rows.group) resource('Categories', 'List the categories of a group', 'The same list, for one group of categories.', three('/categories/{group}/', 'getGroupCategories', { schema: 'CategoryRow', json: rows.group.rows, markdown: rows.group.markdown, keys: CATEGORY_KEYS }))
  resource('Categories', 'Get the results of a category', `A measured category answers with the results of all its tasks, one row for each entry on each runtime. A category that is not measured yet${ex.listedCategory ? ` (\`${ex.listedCategory.id}\`, for one)` : ''} answers with its listed packages, and has no \`results\` files when it lists none.`, three('/{category}/', 'getCategoryResults', { schema: { anyOf: [rowsOf('ResultRow'), rowsOf('CatalogRow')] }, json: rows.category.rows, markdown: rows.category.markdown, keys: ROW_KEYS }))

  // Packages
  resource('Packages', 'List every package', 'Every listed package of every registry, measured or not, the most used first. The figures of the measured ones are in the results.', three('/packages/', 'getPackages', { schema: 'CatalogRow', json: rows.packages.rows, markdown: rows.packages.markdown, keys: CATALOG_KEYS }))
  resource('Packages', 'List the packages of a registry', 'The listed packages of one registry, with their use, category and status. `builtin` has no list of its own, so it answers with the results of the runtime built-ins.', three('/{registry}/', 'getRegistryPackages', { schema: { anyOf: [rowsOf('CatalogRow'), rowsOf('ResultRow')] }, json: rows.registry.rows, markdown: rows.registry.markdown, keys: CATALOG_KEYS }))
  resource('Packages', 'Get the measurements of a package', 'The results of one measured package: a row for each task and runtime it ran on, at the version it is ranked at. A package that is listed and not measured has the Markdown only.', three('/{registry}/{package}/', 'getPackageResults', { schema: 'ResultRow', json: rows.packageRows, markdown: exportsOf.packageMarkdown(ex.pkg, ECOSYSTEMS[ex.pkg.ecosystem].title, ctx), keys: ROW_KEYS, notes: { md: 'The page in Markdown, with its tables and the source of its adapters.' } }))
  resource('Packages', 'Get the measurements of one version of a package', 'The results of a version that was measured. The address without a version is the latest measured one.', [{ path: '/{registry}/{package}/{version}/index.md', id: 'getPackageVersionMarkdown', format: 'md', sample: markdownSample(exportsOf.packageMarkdown({ ...ex.pkg, version: ex.version, appearances: [...ex.pkg.appearances, ...ex.pkg.history].filter((a) => a.entry.version === ex.version) }, ECOSYSTEMS[ex.pkg.ecosystem].title, ctx), 3) }])

  // Results
  const total = model.tasks.reduce((n, d) => n + d.runtimes.reduce((m, r) => m + r.entries.length, 0), 0)
  resource('Results', 'Get every result of every task', 'All the results in one file: a row for each entry on each runtime.', [
    { path: '/data/results.json', id: 'getAllResultsJson', format: 'json', schema: rowsOf('ResultRow'), sample: rowsSample(rows.task, ROW_KEYS, total) },
    { path: '/results.json', id: 'getAllResultsAtRootJson', format: 'json', sameAs: '/data/results.json', schema: rowsOf('ResultRow') },
    { path: '/data/results.csv', id: 'getAllResultsCsv', format: 'csv', rows: rowsOf('ResultRow'), note: 'The same rows as the JSON, under a heading row.', sample: csvSample(rows.task)?.replace(/^… \d+ more rows?/m, `${MORE} ${total - 1} more rows`) },
    { path: '/results.csv', id: 'getAllResultsAtRootCsv', format: 'csv', rows: rowsOf('ResultRow'), sameAs: '/data/results.csv' },
  ])
  resource('Results', 'Get one result', 'An entry at one version on one runtime, with its figures and its adapter\'s source. The address stays the same when a newer version is measured, so it can be cited.', [{ path: '/results/{category}/{task}/{runtime}/{registry}/{result}/index.md', id: 'getResultMarkdown', format: 'md', sample: markdownSample(exportsOf.resultExport(ctx, ex.data, ex.runtime, ex.entry, ex.address).markdown, 3) }])
  resource('Results', 'Resolve a short link', 'A label prints a short code. Its address redirects to the page of the result, or of the runtime\'s summary, that the code stands for.', [
    { path: '/{code}', id: 'followShortLinkAtRoot', format: 'redirect', note: 'The form that labels print. A page of the site at the same address comes first.', redirect: 'A redirect to the page the code stands for.' },
    { path: '/r/{code}', id: 'followShortLink', format: 'redirect', sameAs: '/{code}', redirect: 'A redirect to the page the code stands for.' },
  ])

  // Runtimes
  resource('Runtimes', 'Compare runtimes', 'Medals, and the best and the typical multiple of the best, for each runtime: over all categories, then in each category.', three('/runtimes/', 'getRuntimes', { schema: 'RuntimeScoreRow', json: rows.runtimes.rows, markdown: rows.runtimes.markdown, keys: SCORE_KEYS }))
  resource('Runtimes', 'Get the results of a runtime', 'Every entry that ran on one runtime, in every task.', three('/runtimes/{runtime}/', 'getRuntimeResults', { schema: 'ResultRow', json: rows.runtime.rows, markdown: rows.runtime.markdown, keys: ROW_KEYS }))
  resource('Runtimes', 'Read a runtime\'s summary', 'A short note that names the runtime and the scope, and points to the runtime\'s figures. It is the page a summary label links to.', [{ path: '/results/runtimes/{runtime}/{scope}/index.md', id: 'getRuntimeSummaryMarkdown', format: 'md' }])

  // Labels and embeds
  resource('Labels and embeds', 'Get a label image for a result', 'The full label of one result, for one measure. There is no label for `types` when the entry has no type-check class.', [{ path: '/labels/{category}/{task}/{runtime}/{registry}/{entry}.{measure}.svg', id: 'getLabel', format: 'svg', returns: 'The label, as an SVG image.' }])
  resource('Labels and embeds', 'Embed a badge for a result', 'A smaller shape of the label of one result: a badge, a button, a compact or a wide label. It follows the entry, so it shows whichever version is measured now.', [{ path: '/embed/{category}/{task}/{runtime}/{registry}/{entry}/{file}', id: 'getResultEmbed', format: 'svg', returns: 'The shape, as an SVG image.' }])
  resource('Labels and embeds', 'Embed a badge for a package', 'A shape of the label of a package\'s best result in a task. The best result is the one with the lowest CPU class on any runtime, then the lowest memory.', [{ path: '/embed/{category}/{task}/{registry}/{package}/{file}', id: 'getPackageEmbed', format: 'svg', returns: 'The shape, as an SVG image.' }])
  resource('Labels and embeds', 'Embed a runtime\'s summary label', 'The label of a runtime in one scope, by its best or its typical entry. A running summary: it changes as tasks are added.', [{ path: '/embed/runtimes/{runtime}/{scope}/{basis}/{file}', id: 'getRuntimeSummaryEmbed', format: 'svg', returns: 'The label or shape, as an SVG image.' }])

  return {
    openapi: '3.1.0',
    info: {
      title: 'Package Efficiency Labels',
      summary: 'Efficiency classes from A to G for software packages, as files.',
      description: [
        `The results of ${site.replace(/^https?:\/\//, '')} as files: JSON, CSV, Markdown and SVG labels. Every address answers a plain GET (or HEAD) and needs no key. The files are written when the site is built, so there are no query parameters, no paging and no filtering: take the file and filter it yourself. This description was made from the data of ${day}.`,
        'Names in addresses. A name appears as its registry writes it. A scoped name (`@scope/name`) and a Go module path contain slashes, and each slash is a separator of the address like any other: do not write it as `%2F`. Write `@` as it is, and follow redirects: for a file that the build wrote, the server answers an address that has `@` with a redirect to the same address with `%40`. The files that are put together on request (single results, labels, embeds, adapter source, packages that are not measured) answer both spellings. A parameter that can take more than one segment is marked `x-multi-segment`.',
        'Two families of addresses have the same shape: `/{category}/…` and `/{registry}/…`, and under them `/{category}/{task}/…` and `/{registry}/{package}/…`. The first segment tells them apart: it is a registry id, or else a category id. No category has the id of a registry.',
        'Figures. Every time is in milliseconds and every memory figure in bytes, in every JSON and CSV file, whatever the task; a field\'s name ends in its unit (`cpu_ms`, `memory_bytes`). CPU is CPU time for one unit of work (an operation, a request or a start, as `cpu_per` says). Memory is what the process holds above the same runtime with a do-nothing adapter. Type-check cost is in MB·s. A class goes from A (best) to G, and a "times best" figure is a multiple of the best result: 1 is the best. A task\'s data file is in the same units: `metrics.cpuMs`, `metrics.memoryBytes`. Markdown and the pages show the units a person reads (µs, ms, MB). The results are provisional and come from one machine.',
        'Extensions. The reference page shows one entry for each thing a reader can ask for, with a chooser for its format, and it is put together from these: `x-resource` names the entry an operation belongs to, `x-task` is the entry\'s title, `x-format` its format, `x-about` the entry\'s description, `x-note` what is particular to this format, and `x-same-as` the address of the same file elsewhere. A media type object may carry `x-sample`, a real response cut short, as text, and for a CSV file `x-rows`, the schema its rows have as JSON. A parameter may carry `x-suggestions`: a few real values, for the try box of the page.',
      ].join('\n\n'),
      // The day the data was built: the description has no other version.
      version: day,
    },
    externalDocs: { description: 'The reference page', url: `${site}/api/` },
    servers: [{ url: site }],
    tags: TAGS.map(([name, description]) => ({ name, description })),
    paths,
    components: {
      parameters,
      responses: { NotFound: { description: 'No file at this address. The body is the site\'s "not found" page.', content: { 'text/html': { schema: { type: 'string' } } } } },
      // A row has every one of its fields, in JSON as in CSV; a cell with nothing to say is empty or null.
      schemas: Object.fromEntries(Object.entries(schemasOf(model)).map(([name, schema]) => [name, { title: SCHEMA_TITLES[name] ?? name, ...schema, ...(name.endsWith('Row') ? { required: Object.keys(schema.properties) } : {}) }])),
    },
  }
}

// --- The page -------------------------------------------------------------------
// The page and its Markdown are both drawn from the description and from the
// same few lists of sentences below, so the two say the same thing.

// `code` in a sentence becomes <code>; with `links`, an address of the site
// that has nothing to fill in becomes a link to it.
const prose = (text, links = false) => esc(text).replace(/`([^`]+)`/g, (_, code) => (links && /^\/[^{}…<]*$/.test(code) && code.length > 1 ? `<a href="${encodeURI(code.replace(/&amp;/g, '&'))}"><code>${code}</code></a>` : `<code>${code}</code>`))
const deref = (spec, node) => (node?.$ref ? node.$ref.slice(2).split('/').reduce((at, key) => at[key], spec) : node)
const refName = (node) => node?.$ref?.split('/').at(-1)

// A path with its example values in place.
export function exampleAddress(spec, path) {
  const declared = (spec.paths[path].get.parameters ?? []).map((p) => deref(spec, p))
  return path.replace(/\{(\w+)\}/g, (_, name) => String(declared.find((p) => p.name === name).example))
}

// A schema's type in a few words. `named` writes the name of a named schema:
// a link to its fields on the page, the bare name in Markdown.
const plain = (name) => name
function typeText(schema, named = plain) {
  if (!schema) return ''
  if (schema.$ref) return named(refName(schema))
  if (schema.anyOf) return schema.anyOf.map((one) => typeText(one, named)).join(' or ')
  if (schema.type === 'array') return `list of ${schema.prefixItems ? 'values' : typeText(schema.items, named) || 'values'}`
  if (schema.type === 'object' && schema.additionalProperties && !Object.keys(schema.properties ?? {}).length) return `map of ${typeText(schema.additionalProperties, named) || 'values'}`
  return [schema.type ?? 'any'].flat().join(' or ')
}
const table = (kind, head, body) => `<div class="scroll"><table class="api-table api-${kind}"><thead><tr>${head.map((h) => `<th scope="col"${h === head[0] ? '' : ' class="l"'}>${h}</th>`).join('')}</tr></thead><tbody>\n${body.join('\n')}\n</tbody></table></div>`
const mdTable = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, '\\|')).join(' | ')} |`)].join('\n')
// A file as a fenced block, as the site's other Markdown pages write one.
const fenced = (language, text) => `\`\`\`\`${language}\n${text}\n\`\`\`\``

// The fields of a schema, an object inside it written as `outer.inner`:
// name, whether it can be missing, its schema, and its description.
function fieldsOf(schema, prefix = '') {
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties ?? {}).flatMap(([name, field]) => {
    const inner = field.type === 'array' ? field.items : field
    const nested = !inner.$ref && inner.type === 'object' && Object.keys(inner.properties ?? {}).length ? fieldsOf(inner, `${prefix}${name}${field.type === 'array' ? '[]' : ''}.`) : []
    const mapped = !inner.$ref && inner.type === 'object' && inner.additionalProperties?.properties ? fieldsOf(inner.additionalProperties, `${prefix}${name}.*.`) : []
    // The values a field can take, where its description does not name them.
    const values = field.description && !/One of|: `/.test(field.description) && field.enum && field.enum.length <= 8 && !/class|medal/i.test(name) ? ` One of ${field.enum.filter((v) => v !== '' && v !== null).map((v) => `\`${v}\``).join(', ')}.` : ''
    return [{ name: prefix + name, optional: !required.has(name) && !prefix, schema: field, description: `${field.description ?? ''}${values}` }, ...nested, ...mapped]
  })
}

// The entries of the page, put together from the description: the operations
// that share `x-resource` are one entry, each a variant of it in its own
// format. An operation that is the same file at another address (`x-same-as`)
// is listed under the variant it repeats.
export function apiEntries(spec) {
  const entries = new Map()
  for (const [path, item] of Object.entries(spec.paths)) {
    const op = item.get
    if (!entries.has(op['x-resource'])) entries.set(op['x-resource'], { id: op['x-resource'], title: op['x-task'], tag: op.tags[0], about: op['x-about'], variants: [], twins: [] })
    const entry = entries.get(op['x-resource'])
    if (op['x-same-as']) entry.twins.push({ path, op })
    else entry.variants.push({ path, op, format: op['x-format'], also: [] })
  }
  for (const entry of entries.values()) {
    for (const twin of entry.twins) entry.variants.find((variant) => variant.path === twin.op['x-same-as']).also.push(twin)
    delete entry.twins
  }
  return [...entries.values()]
}
const groupsOf = (spec, entries = apiEntries(spec)) => spec.tags.map((tag) => ({ ...tag, entries: entries.filter((entry) => entry.tag === tag.name) })).filter((group) => group.entries.length)

// The named schemas a schema refers to, in the order met.
function namesIn(schema, found = []) {
  if (!schema || typeof schema !== 'object') return found
  if (schema.$ref) { if (!found.includes(refName(schema))) found.push(refName(schema)); return found }
  for (const value of Object.values(schema)) namesIn(value, found)
  return found
}
// The shapes an entry returns, each spelled out inside the entry: what each
// of its formats answers with (a CSV has the fields of its rows), then every
// named schema those refer to. Each says which formats it belongs to.
function shapesOf(spec, entry) {
  const shapes = new Map()
  const add = (name, format) => {
    const held = shapes.get(name) ?? shapes.set(name, { name, schema: spec.components.schemas[name], formats: [] }).get(name)
    if (held.formats.includes(format)) return
    held.formats.push(format)
    for (const inner of namesIn(held.schema)) add(inner, format)
  }
  for (const { op, format } of entry.variants) {
    const content = Object.values(op.responses[200]?.content ?? {})[0]
    for (const name of namesIn(content?.schema ?? {}).concat(namesIn(content?.['x-rows'] ?? {}))) add(name, format)
  }
  return [...shapes.values()].map((shape) => {
    const fields = fieldsOf(shape.schema.type === 'array' ? shape.schema.items : shape.schema)
    return { ...shape, fields, heading: `Fields of ${shape.schema.title} (${fields.length})`, about: `${entry.variants.length > 1 ? `In ${shape.formats.join(' and ')}. ` : ''}${schemaIntro(shape.schema)}` }
  })
}
const schemaIntro = (schema) => `${schema.description ?? ''}${schema.type === 'array' ? ' Each item:' : ''}`
const OPTIONAL = 'A field marked optional is missing where it does not apply. A file can have more fields than are listed.'

// What one address of an entry says, for the page and for its Markdown.
function variantFacts(spec, { path, op, also }) {
  const status = op.responses[200] ? 200 : 308
  const [media, content] = Object.entries(op.responses[status].content ?? {})[0] ?? []
  const address = encodeURI(exampleAddress(spec, path))
  const schema = content?.schema
  const named = schema && (schema.$ref || schema.items?.$ref || schema.anyOf)
  return {
    status, media, address,
    // Whether the JSON is a list (of rows) or one object.
    list: Boolean(schema && (schema.type === 'array' || schema.anyOf || deref(spec, schema).type === 'array')),
    url: `${spec.servers[0].url}${address}`,
    curl: `curl ${status === 308 ? '-sI' : '-sL'} ${spec.servers[0].url}${address}`,
    params: (op.parameters ?? []).map((p) => deref(spec, p)),
    sample: content?.['x-sample'],
    note: op['x-note'] ?? '',
    twins: also.length ? `The same ${status === 308 ? 'redirect' : 'file'} is at ${also.map((twin) => `\`${twin.path}\``).join(' and ')}.` : '',
    // `named` as in typeText.
    returns: (how) => (status === 308
      ? 'Answers `308` with the page\'s address in `Location`, and `404` for a code that was not given out.'
      : `Returns \`${media}\`${named ? `: ${typeText(schema, how)}` : content?.['x-rows'] ? `: a row for each ${namesIn(content['x-rows']).map(how).join(' or ')}, under a heading row` : ''}. An address that does not exist answers \`404\`.`),
  }
}
const MULTI = 'Can take more than one segment.'
const LANGUAGE = { [MEDIA.json]: 'json', [MEDIA.csv]: 'csv', [MEDIA.md]: 'markdown', [MEDIA.text]: 'text' }

// One entry as Markdown: what the page says of it, with every format.
function entryMarkdown(spec, entry) {
  const many = entry.variants.length > 1
  return `### ${entry.title}

${entry.about}

${entry.variants.map((variant) => {
    const facts = variantFacts(spec, variant)
    return [
      many ? `#### ${variant.format}` : '',
      `\`GET ${variant.path}\``,
      [facts.note, facts.twins].filter(Boolean).join(' '),
      facts.params.length ? mdTable(['Parameter', 'Type', 'Description', 'Example'], facts.params.map((p) => [`\`${p.name}\``, typeText(p.schema), `${p.description}${p['x-multi-segment'] ? ` ${MULTI}` : ''}`, `\`${p.example}\``])) : '',
      facts.returns((name) => name),
      facts.sample ? `Example, cut short:\n\n${fenced(LANGUAGE[facts.media] ?? '', facts.sample)}` : '',
      fenced('sh', facts.curl),
    ].filter(Boolean).join('\n\n')
  }).concat(shapesOf(spec, entry).map((shape) => `#### ${shape.heading}\n\n\`${shape.name}\`. ${shape.about}\n\n${mdTable(['Field', 'Type', 'Description'], shape.fields.map((field) => [`\`${field.name}\`${field.optional ? ' (optional)' : ''}`, typeText(field.schema), field.description]))}`)).join('\n\n')}`
}

// The path with each part to fill in set off. The script writes what is typed
// in the try box into these parts.
const pathHtml = (path) => esc(path).replace(/\{(\w+)\}/g, '<span class="api-param" data-name="$1">{$1}</span>')

// The same request in each language the site has packages for, and curl: a
// small program that runs as it is. JavaScript, Python, Ruby and Go use what
// comes with the language; Rust has no HTTP client of its own, so its example
// names the one crate it needs. For a redirect the example prints where it
// leads. Each is [id, name on its tab, name in full, highlight.js language].
const LANGUAGES = [['curl', 'curl', 'curl', 'bash'], ['javascript', 'JavaScript', 'JavaScript and TypeScript', 'javascript'], ['python', 'Python', 'Python', 'python'], ['ruby', 'Ruby', 'Ruby', 'ruby'], ['go', 'Go', 'Go', 'go'], ['rust', 'Rust', 'Rust', 'rust']]
function requestExamples({ url, status, media, list }) {
  const json = media === MEDIA.json, redirect = status === 308
  const go = (imports, body) => `package main\n\nimport (\n${imports.map((name) => `\t"${name}"`).join('\n')}\n)\n\nfunc main() {\n\tresponse, err := http.Get("${url}")\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tdefer response.Body.Close()\n\tif response.StatusCode != http.StatusOK {\n\t\tlog.Fatal(response.Status)\n\t}\n${body}\n}`
  const rust = (dependencies, uses, body) => `// The standard library has no HTTP client: this uses the ureq crate.\n// Cargo.toml: ${dependencies.join('\n//             ')}\n${uses}fn main() -> Result<(), ureq::Error> {\n${body}\n    Ok(())\n}`
  return {
    curl: `curl ${redirect ? '-sI' : '-sL'} ${url}`,
    javascript: redirect
      ? `const response = await fetch('${url}')\nconsole.log(response.url)`
      : `const response = await fetch('${url}')\nconst ${json ? 'data' : 'text'} = await response.${json ? 'json' : 'text'}()`,
    // The site's host refuses the name urllib gives itself, so the example gives another.
    python: `import ${json ? 'json, ' : ''}urllib.request\n\nrequest = urllib.request.Request('${url}', headers={'User-Agent': 'my-script'})\nwith urllib.request.urlopen(request) as response:\n    ${redirect ? 'print(response.url)' : json ? 'data = json.load(response)' : 'text = response.read().decode(\'utf-8\')'}`,
    // open-uri does not follow a 308, so the redirect is read from its header.
    ruby: redirect
      ? `require 'net/http'\n\nputs Net::HTTP.get_response(URI('${url}'))['location']`
      : json
        ? `require 'json'\nrequire 'open-uri'\n\ndata = JSON.parse(URI.open('${url}').read)`
        : `require 'open-uri'\n\ntext = URI.open('${url}').read`,
    go: redirect
      ? go(['fmt', 'log', 'net/http'], '\n\tfmt.Println(response.Request.URL)')
      : json
        ? go(['encoding/json', 'fmt', 'log', 'net/http'], `\n\tvar data ${list ? '[]map[string]any' : 'map[string]any'}\n\tif err := json.NewDecoder(response.Body).Decode(&data); err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tfmt.Println(len(data), "${list ? 'rows' : 'fields'}")`)
        : go(['fmt', 'io', 'log', 'net/http'], '\n\ttext, err := io.ReadAll(response.Body)\n\tif err != nil {\n\t\tlog.Fatal(err)\n\t}\n\tfmt.Print(string(text))'),
    rust: redirect
      ? rust(['ureq = "3"'], 'use ureq::ResponseExt;\n\n', `    let response = ureq::get("${url}").call()?;\n    println!("{}", response.get_uri());`)
      : json
        ? rust(['ureq = { version = "3", features = ["json"] }', 'serde_json = "1"'], '', `    let data: serde_json::Value = ureq::get("${url}")\n        .call()?\n        .body_mut()\n        .read_json()?;\n    println!("{data}");`)
        : rust(['ureq = "3"'], '', `    let text = ureq::get("${url}")\n        .call()?\n        .body_mut()\n        .read_to_string()?;\n    print!("{text}");`),
  }
}
// An example as highlighted HTML, by the site's own highlighter (the one of
// the benchmark source pages), with its address in a part of its own: the
// script writes what is typed in the try box into that part as text, and the
// highlighting around it stays.
const ADDRESS = 'APIADDRESS0000'
const exampleHtml = (text, url, language) => highlighted(text.split(url).join(ADDRESS), language).split(ADDRESS).join(`<span class="api-url">${esc(url)}</span>`)
// A sample of an answer, highlighted where the site's highlighter knows the format.
const sampleHtml = (text, media) => highlighted(text, { [MEDIA.json]: 'json', [MEDIA.md]: 'markdown' }[media], { lenient: true })

// A field of the try box for one parameter: a select where the values are a
// short fixed list, otherwise a text field, with a few real values offered.
function tryField(entry, op, p) {
  const id = `try-${slug(op.operationId)}-${p.name}`
  const control = p.schema.enum
    ? `<select id="${id}" name="${esc(p.name)}">${p.schema.enum.map((value) => `<option${value === p.example ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select>`
    : `<input id="${id}" name="${esc(p.name)}" value="${esc(p.example)}" spellcheck="false" autocomplete="off" autocapitalize="off"${p['x-suggestions']?.length ? ` list="api-values-${esc(p.name)}"` : ''}>`
  return `<label for="${id}"><code>${esc(p.name)}</code></label>${control}`
}

// One address of an entry, the part that describes it: the path, what is
// particular to it, its parameters and what it answers with.
function variantHtml(spec, entry, variant) {
  const { path, op, format, also } = variant
  const facts = variantFacts(spec, variant)
  // The address of the same file elsewhere keeps the anchor it had as an entry of its own.
  const twins = also.length ? ` The same ${facts.status === 308 ? 'redirect' : 'file'} is at ${also.map((twin) => `<code id="${esc(slug(twin.op.operationId))}">${esc(twin.path)}</code>`).join(' and ')}.` : ''
  return `<div class="api-variant" id="${esc(slug(op.operationId))}" data-format="${esc(slug(format))}" data-path="${esc(path)}" data-site="${esc(spec.servers[0].url)}" data-address="${esc(facts.url)}">
${entry.variants.length > 1 ? `<h4 class="api-format">${esc(format)}</h4>` : ''}
<p class="api-sig"><span class="api-method">GET</span> <code class="api-path">${pathHtml(path)}</code></p>
${facts.note || twins ? `<p>${prose(facts.note)}${twins}</p>` : ''}
${facts.params.length ? table('params', ['Parameter', 'Type', 'Description', 'Example'], facts.params.map((p) => `<tr><td><code>${esc(p.name)}</code></td><td class="l api-type">${typeText(p.schema)}</td><td class="l api-wrap">${prose(p.description)}${p['x-multi-segment'] ? ` <span class="soft">${MULTI}</span>` : ''}</td><td class="l"><code>${esc(p.example)}</code></td></tr>`)) : ''}
<p class="api-returns">${prose(facts.returns((name) => `\u0000${name}\u0000`)).replace(/\u0000(\w+)\u0000/g, (_, name) => `<a href="#${esc(entry.id)}-${slug(name)}">${esc(name)}</a>`)}</p>
</div>`
}

// The same address, the part beside the description: the try box, the
// request in each language, the answer once it is sent, and a sample answer.
function requestHtml(spec, entry, variant) {
  const facts = variantFacts(spec, variant)
  const examples = requestExamples(facts)
  const figure = facts.media === MEDIA.svg ? `<p><img class="api-figure" src="${esc(facts.address)}" alt="The example: ${esc(entry.title.toLowerCase())}" loading="lazy"></p>` : ''
  return `<div class="api-request" data-format="${esc(slug(variant.format))}">
${entry.variants.length > 1 ? `<h4 class="api-format">${esc(variant.format)}</h4>` : ''}
<form class="api-try" hidden>
<h4>Try it</h4>
${facts.params.length ? `<div class="api-try-fields">${facts.params.map((p) => tryField(entry, variant.op, p)).join('\n')}</div>` : ''}
<p class="api-try-send"><button type="submit" class="api-send" title="Ask this site for the address and show the answer below">Fetch</button><button type="button" data-copy="address" hidden title="Copy the address${entry.variants.length > 1 ? ' of the format that is shown' : ''}, with what is typed here">Copy address</button></p>
</form>
<div class="api-box">
<div class="api-box-head"><span class="api-box-title">Request</span><button type="button" class="api-copy" hidden title="Copy the example that is shown">Copy</button></div>
<div class="api-tabs" role="group" aria-label="Language" hidden>${LANGUAGES.map(([id, name, full]) => `<button type="button" data-language="${id}"${full === name ? '' : ` title="${full}"`}>${name}</button>`).join('')}</div>
${LANGUAGES.map(([id, , full, language]) => `<div class="api-code" data-language="${id}"><h5 class="api-language">${full}</h5><pre tabindex="0"><code>${exampleHtml(examples[id], facts.url, language)}</code></pre></div>`).join('\n')}
</div>
<div class="api-box api-result" hidden aria-live="polite"></div>
${facts.sample || figure ? `<div class="api-box">
<div class="api-box-head"><span class="api-box-title">Example response${facts.sample ? ', cut short' : ''}</span></div>
${facts.sample ? `<pre class="api-sample" tabindex="0"><code>${sampleHtml(facts.sample, facts.media)}</code></pre>` : ''}${figure}
</div>` : ''}
</div>`
}

// One entry: its task as the title, then two columns where there is room.
// On the left what it is and what to send; on the right, staying in view,
// how to ask and what comes back; under the left column the fields of the
// answer. In one column the order is the same: description, examples, fields.
// Every format and every language is in the page; the script (site/api.js)
// shows one at a time. The buttons copy what is already in the page.
function entryHtml(spec, entry) {
  const many = entry.variants.length > 1
  return `<section class="api-entry" id="${esc(entry.id)}">
<h3>${esc(entry.title)}</h3>
<div class="api-cols">
<div class="api-main">
<p>${prose(entry.about, true)}</p>
<div class="api-bar" hidden>
${many ? `<p class="api-choose"><label for="format-${esc(entry.id)}">Format</label> <select id="format-${esc(entry.id)}">${entry.variants.map((variant) => `<option value="${esc(slug(variant.format))}">${esc(variant.format)}</option>`).join('')}</select></p>` : ''}
<p class="api-actions menu"><button type="button" data-copy="markdown" title="Copy this entry as Markdown${many ? ', with all its formats' : ''}">Copy as Markdown</button></p>
</div>
<template class="api-markdown">${esc(entryMarkdown(spec, entry))}</template>
${entry.variants.map((variant) => variantHtml(spec, entry, variant)).join('\n')}
</div>
<div class="api-side"><div class="api-sticky">
${entry.variants.map((variant) => requestHtml(spec, entry, variant)).join('\n')}
</div></div>
<div class="api-fields">
${shapesOf(spec, entry).map((shape) => `<details class="api-fields-of" id="${esc(entry.id)}-${slug(shape.name)}" data-formats="${esc(shape.formats.map(slug).join(' '))}" open>
<summary>${esc(shape.heading)} <code class="soft">${esc(shape.name)}</code></summary>
<p>${prose(shape.about)}</p>
${table('fields', ['Field', 'Type', 'Description'], shape.fields.map((field) => `<tr><td><code>${esc(field.name)}</code>${field.optional ? ' <span class="soft">optional</span>' : ''}</td><td class="l api-type">${typeText(field.schema, (name) => `<a href="#${esc(entry.id)}-${slug(name)}">${esc(name)}</a>`)}</td><td class="l api-wrap">${prose(field.description)}</td></tr>`))}
</details>`).join('\n')}
</div>
</div>
</section>`
}

// A few real values for the text fields of the try box, one list for each
// parameter that has some (`x-suggestions` in the description).
const suggestionLists = (spec) => Object.values(spec.components.parameters).filter((p) => p['x-suggestions']?.length && !p.schema.enum).map((p) => `<datalist id="api-values-${esc(p.name)}">${p['x-suggestions'].map((value) => `<option value="${esc(value)}">`).join('')}</datalist>`).join('\n')

// The page's script: site/api.js, which the build copies beside the pages.
// Without it every format and every language is shown, one after the other
// under its name; the try box and the copy buttons, which would do nothing,
// stay hidden.
const PAGE_SCRIPT = '<script type="module" src="/api.js"></script>'

// The sentences of the introduction, with \`code\` in backticks: the page and
// its Markdown both print these.
function introOf(model, spec) {
  const ex = examplesOf(model)
  const entries = apiEntries(spec)
  const day = new Date(model.index.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return {
    lead: `Every page of results is also published as files at regular addresses: JSON, CSV, Markdown, and the labels as SVG images. This page lists what you can ask for: ${entries.length} things, at ${Object.keys(spec.paths).length} kinds of address. Where a thing comes in more than one format, its entry has each of them.`,
    basics: [
      ['Base address', `\`${spec.servers[0].url}\``],
      ['Requests', '`GET` and `HEAD` only. No key, no account, no query parameters.'],
      ['Files', `Written when the site is built, not worked out for each request. There is no paging and no filtering: take the file and filter it yourself. The data here is of ${day}.`],
      ['Other sites', 'The server sends no CORS headers, so a script on another site cannot read these files in a browser. A label works on any site as an image.'],
      ['Caching', 'Labels, embeds, single results and the other files that are put together on request can be kept for five minutes (`max-age=300`).'],
      ['Fields', `Each entry lists the fields of what it returns, for JSON and for CSV. ${OPTIONAL}`],
      ['Errors', 'An address that does not exist answers `404` with the site\'s "not found" page as HTML, also where JSON was asked for.'],
      ['Status', 'Provisional. All results come from one developer laptop, and the fields can change as the site does.'],
    ],
    start: 'A good place to start is `/data/index.json`: it lists every task and category, and its ids fill the `{category}` and `{task}` of the other addresses. Every result of every task, as flat rows, is in `/data/results.json`.',
    names: [
      ex.scoped ? `A scoped package keeps its slash: \`${ex.scoped.name}\` is at \`${urls.package(ex.scoped)}results.json\`.` : '',
      ex.goMeasured ? `A measured Go module has a short name of its own: \`${ex.goMeasured.module}\` is at \`${urls.package(ex.goMeasured)}results.json\`. The field \`module\` of its entries has the path.` : '',
      ex.goListed ? `A Go module that is listed and not measured is named by its path, with its slashes: \`/${ex.goListed.ecosystem}/${ex.goListed.name}/index.md\`.` : '',
      'Do not write a slash of a name as `%2F`. Each one is a separator of the address like any other.',
      'Write `@` as it is, and follow redirects (`curl -L`). For a file that the build wrote, the server answers an address that has `@` with a redirect to the same address with `%40`. The files that are put together on request (single results, labels, embeds, adapter source, packages that are not measured) answer both spellings.',
      'An address of a page ends in a slash. Without it, the server redirects to the address with it.',
    ].filter(Boolean),
    shapes: `Two families of addresses have the same shape: \`/{category}/…\` and \`/{registry}/…\`. The first segment tells them apart: it is a registry id (${Object.keys(ECOSYSTEMS).map((id) => `\`${id}\``).join(', ')}), or else a category id. No category has the id of a registry.`,
    figures: [
      'Every time is in milliseconds and every memory figure in bytes, in every JSON and CSV file, whatever the task. A field\'s name ends in its unit: `cpu_ms`, `memory_bytes`. Bytes are bytes: no megabyte of either kind is involved.',
      'Markdown and the pages show the units a person reads: µs, ms and MB (of 1,000,000 bytes).',
      'CPU is CPU time for one unit of work, and `cpu_per` says which: an operation, a request, or a start in a startup task. It counts user and system time on all threads. An operation of 23.6 µs is 0.0236 ms.',
      'Memory is what the process holds after the task and a garbage collection, above the same runtime with a do-nothing adapter on the same inputs.',
      'Type-check cost is in MB·s: added compiler CPU time in seconds multiplied by added compiler memory in MB. Both parts are published beside it, in ms and in bytes.',
      'A task\'s data file is in the same units: an entry\'s `metrics.cpuMs` and `metrics.memoryBytes`, the `value` of each class, the floors and the best results. Its `displayUnit` only says what the pages show.',
      'A class goes from A (best) to G. It says how many times the best result an entry costs.',
      'A "times best" figure, or `ratio`, is that multiple of the best: 1 is the best, 2 costs twice as much. It has no unit.',
    ],
  }
}
/**
 * The reference page, drawn from `openApiSpec(model)`. Returns the page's
 * title and description, and `body`: the HTML that goes inside <main>.
 * Pass `spec` when it is already made, so that it is not worked out twice.
 */
export function apiPage(model, spec = openApiSpec(model)) {
  const intro = introOf(model, spec)
  const groups = groupsOf(spec)

  const body = `<h1>API</h1>
<p class="intro">${prose(intro.lead)} The same list is in <a href="/openapi.json"><code>/openapi.json</code></a>, an OpenAPI 3.1 description, and this page is drawn from it.</p>

<h2 id="api-basics">Basics</h2>
<div class="scroll"><table class="api-table api-facts"><tbody>
${intro.basics.map(([name, text]) => `<tr><th scope="row">${esc(name)}</th><td class="l api-wrap">${prose(text)}</td></tr>`).join('\n')}
</tbody></table></div>
<p>${prose(intro.start, true)}</p>

<h2 id="api-names">Names in addresses</h2>
<p>A name appears in an address as its registry writes it.</p>
<ul>
${intro.names.map((text) => `<li>${prose(text, true)}</li>`).join('\n')}
</ul>
<p>${prose(intro.shapes)}</p>

<h2 id="api-figures">Figures</h2>
<ul>
${intro.figures.map((text) => `<li>${prose(text)}</li>`).join('\n')}
</ul>

${groups.map((group) => `<h2 id="${slug(group.name)}">${esc(group.name)}</h2>
<p>${prose(group.description)}</p>
<ul class="api-list">
${group.entries.map((entry) => `<li><a href="#${esc(entry.id)}">${esc(entry.title)}</a></li>`).join('\n')}
</ul>
${group.entries.map((entry) => entryHtml(spec, entry)).join('\n')}`).join('\n\n')}
${suggestionLists(spec)}
${PAGE_SCRIPT}`

  return {
    title: 'API: Package Efficiency Labels',
    description: 'The addresses of the JSON, CSV, Markdown and SVG files behind every page of results, with their parameters, fields and units.',
    body,
  }
}

/**
 * The same page as Markdown (/api/index.md): the introduction, every entry
 * with all its formats, and the fields. Each entry's text is the one its
 * "Copy as Markdown" button copies.
 */
export function apiMarkdown(model, spec = openApiSpec(model)) {
  const intro = introOf(model, spec)
  const site = spec.servers[0].url
  return `# API: Package Efficiency Labels

${intro.lead} The same list is in ${site}/openapi.json, an OpenAPI 3.1 description, and this page is drawn from it.

## Basics

${intro.basics.map(([name, text]) => `- ${name}: ${text}`).join('\n')}

${intro.start}

## Names in addresses

A name appears in an address as its registry writes it.

${intro.names.map((text) => `- ${text}`).join('\n')}

${intro.shapes}

## Figures

${intro.figures.map((text) => `- ${text}`).join('\n')}

${groupsOf(spec).map((group) => `## ${group.name}

${group.description}

${group.entries.map((entry) => entryMarkdown(spec, entry)).join('\n\n')}`).join('\n\n')}

## More

- Page: ${site}/api/
- The OpenAPI description: ${site}/openapi.json
- Everything: ${site}/llms.txt
`
}

// The page's own menu, shown where the other pages have the catalog: the
// sections of the introduction, then under each group what a reader can ask
// for, by the title of its entry.
// Short names for the side menu; an entry's full title stays on the page and
// as the link's title. An entry without one here shows its full title.
const SHORT_TITLES = {
  'List the tasks and categories that have results': 'Index of results',
  'List the packages that are not measured yet': 'Unmeasured packages',
  'Search names': 'Search index',
  'Read the whole site as one text': 'Whole site as text',
  'List the tasks': 'All tasks',
  'Get every result of a task': 'Task results',
  'Read the benchmark source of a task': 'Task source',
  "Read an adapter's source": 'Adapter source',
  'List the categories': 'All categories',
  'List the categories of a group': 'Group of categories',
  'Get the results of a category': 'Category results',
  'List every package': 'All packages',
  'List the packages of a registry': 'Registry packages',
  'Get the measurements of a package': 'Package results',
  'Get the measurements of one version of a package': 'Package version',
  'Get every result of every task': 'All results',
  'Get one result': 'One result',
  'Resolve a short link': 'Short link',
  'Compare runtimes': 'All runtimes',
  'Get the results of a runtime': 'Runtime results',
  "Read a runtime's summary": 'Runtime summary',
  'Get a label image for a result': 'Result label',
  'Embed a badge for a result': 'Result badge',
  'Embed a badge for a package': 'Package badge',
  "Embed a runtime's summary label": 'Runtime label',
}
export function apiSideNav(spec) {
  return `<h2><a href="#api-basics">Basics</a></h2>
<ul><li><a href="#api-names">Names in addresses</a></li><li><a href="#api-figures">Figures</a></li></ul>
${groupsOf(spec).map((group) => `<h2><a href="#${slug(group.name)}">${esc(group.name)}</a></h2>
<ul>${group.entries.map((entry) => `<li><a href="#${esc(entry.id)}" title="${esc(entry.title)}"><span class="api-get" aria-hidden="true">GET</span>${esc(SHORT_TITLES[entry.title] ?? entry.title)}</a></li>`).join('')}</ul>`).join('\n')}`
}
