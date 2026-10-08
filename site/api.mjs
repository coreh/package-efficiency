// The site's machine-readable files, documented as an API: an OpenAPI 3.1
// description of every address that answers with JSON, CSV, Markdown or an
// SVG label, and the reference page drawn from that same description, so the
// two cannot disagree.
//
// Everything imported from pages.mjs is used inside functions only, so that
// pages.mjs may import this file in turn.
import { RANKINGS, resultPath, shortCodes } from './label.mjs'
import { ECOSYSTEMS, allKnownPackages, catalogUrl, categoryHref, eventMedals, runtimeMedals, runtimeScores, searchIndex, statusOf, urls, versionsOf } from './pages.mjs'
import { adapterIdOf } from './source.mjs'
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
  return { url: (to) => `${site}${to}`, edition: model.index.edition, model, ecosystems: ECOSYSTEMS, runtimeScores, statusOf, categoryHref, catalogUrl, allKnownPackages, eventMedals: (data) => medals.get(data) ?? medals.set(data, eventMedals(data)).get(data), runtimeMedals }
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
const ROW_KEYS = ['task', 'ecosystem', 'package', 'version', 'runtime', 'cpu_unit', 'cpu', 'cpu_class', 'cpu_times_best', 'memory_mb', 'memory_class', 'type_check_cost', 'type_check_class']
const rowsSample = (rows, keys, total = rows?.length) => (rows?.length ? jsonSample(first(rows, 1, (row) => pick(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, shorten(v)])), keys), total)) : undefined)
// A CSV file's heading and first row: its first columns only, long cells cut.
function csvSample(rows, columns = 7) {
  if (!rows?.length) return undefined
  const keys = Object.keys(rows[0])
  const [head, line] = exportsOf.toCsv([Object.fromEntries(keys.slice(0, columns).map((key) => [key, shorten(rows[0][key], 44)]))]).trimEnd().split('\n')
  const more = keys.length > columns ? `,${MORE}` : ''
  return `${head}${more}\n${line}${more}\n${MORE} ${rows.length - 1} more ${rows.length === 2 ? 'row' : 'rows'}, ${keys.length} columns in all`
}
// The first lines of a Markdown file.
const markdownSample = (text, lines = 5) => (text ? `${text.split('\n').filter((line, at, all) => line || all[at - 1]).slice(0, lines).map((line) => shorten(line, 150)).join('\n')}\n${MORE}` : undefined)

function taskDataSample(data, runtime, entry) {
  const cpuKey = data.task.metrics.cpu.key
  return jsonSample(pick(data, ['edition', 'generatedAt'], {
    task: pick(data.task, ['id', 'title', 'kind']),
    metrics: { cpu: pick(data.metrics.cpu, ['unit', 'headline', 'scale', 'anchor']), [MORE]: 'memory, in the same form' },
    runtimes: first([runtime], 1, (r) => pick(r, ['id', 'title', 'version'], {
      entries: first([entry, ...r.entries.filter((e) => e !== entry)], 1, (e) => pick(e, ['id', 'ecosystem', 'package', 'version'], {
        metrics: pick(e.metrics, [cpuKey, 'memoryMb', 'settledRssMb']),
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
      edition: S.string('Edition of the results.'),
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
    }, { required: ['edition', 'generatedAt', 'categories', 'tasks'] }),

    TaskData: S.object('Everything measured in one task: the scales, and every entry on every runtime.', {
      edition: S.string('Edition of the results.'),
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
    }, { required: ['edition', 'generatedAt', 'machine', 'task', 'metrics', 'runtimes'] }),

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
      metrics: S.object('The task\'s own settings for CPU and memory: the measured field (`key`), its unit, and the floor.', {}, { additionalProperties: { type: 'object' } }),
      fixtureCount: S.integer('Number of inputs.'),
      strictness: S.string('For a task of a pair that differ in how strict the check is.', { enum: ['strict', 'lenient'] }),
      pairedWith: S.string('Id of the other task of the pair.'),
      adaptersFrom: S.string('Id of the task whose adapters this one runs.'),
    }, { required: ['id', 'category', 'task', 'title', 'summary', 'kind'] }),

    Metric: S.object('One graded measure of a task.', {
      unit: S.string('Unit of the figure: `µs` or `ms` for CPU, `MB` for memory.'),
      headline: S.string('The unit in words, for example "µs of CPU per operation".'),
      scale: scale('result'),
      floor: S.number('A figure below this counts as this, in the unit of the measure.'),
      anchor: anchor('the unit of the measure'),
    }, { required: ['unit', 'scale'] }),

    TypeCheckMetric: S.object('How type-check cost is graded for one type checker.', {
      unit: S.string('Always `MB·s`: added compiler CPU time in seconds multiplied by added compiler memory in MB.'),
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
    }, { required: ['unit', 'scale'] }),

    Runtime: S.object('A runtime in one task.', {
      id: S.string('Runtime id.', { enum: runtimes }),
      title: S.string('Name of the runtime.'),
      version: S.string('Version that ran.'),
      language: S.string('Language of its adapters.'),
      garbageCollected: S.boolean('Whether the runtime has a garbage collector.'),
      heapDescription: S.string('What the runtime reports as its heap.'),
      baselineHeapKb: S.maybe('number', 'Heap of the do-nothing adapter, in kB.'),
      baselineMb: S.number('Memory of the do-nothing adapter on the same inputs, in MB. It is subtracted from every entry.'),
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
        cpu: grade('the task\'s CPU unit (µs of CPU per operation or per request, or ms of CPU per start)'),
        memory: grade('MB'),
        types: grade('MB·s'),
      }, { required: ['cpu', 'memory'] }),
      runtimeGrades: S.object('Classes for comparing runtimes.', { memory: grade('MB of the whole process after the task and a garbage collection') }),
      types: {
        type: ['object', 'null'],
        description: 'The type-check measurement. Null when nothing was checked.',
        properties: {
          value: S.number('Type-check cost, in MB·s.'),
          cpuMs: S.number('Added compiler CPU time, in ms.'),
          memoryMb: S.number('Added compiler memory, in MB.'),
          timeMs: S.number('Added elapsed time of the type checker, in ms.'),
          tool: S.string('The type checker.'),
          from: S.string('Where the types come from: `bundled` with the package, or the package that has them.'),
          community: S.boolean('True when other people than the package\'s authors wrote the types.'),
          compilers: S.object('For TypeScript, the figures of each compiler, by name: `cpuMs`, `memoryMb`, `score` (MB·s), `class` and `ratio`.', {}, { additionalProperties: { type: 'object' } }),
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

    EntryMetrics: S.object('The figures of one result. Each is the median of the rounds of a run, then of the runs. A task has either the fields per operation or the fields per request.', {
      cpuPerOperationUs: S.number('CPU time per operation, in µs: user and system time, all threads.'),
      cpuPerRequestUs: S.number('CPU time per request, in µs: user and system time, all threads.'),
      startupCpuMs: S.number('In a startup task, CPU time to start and serve one page, in ms.'),
      startupMs: S.number('In a startup task, elapsed time to the first page, in ms.'),
      operationsPerCpuSecond: S.integer('Operations per second of CPU time.'),
      requestsPerCpuSecond: S.integer('Requests per second of CPU time.'),
      memoryMb: S.number('Memory the process holds after the task and a garbage collection, above the do-nothing adapter, in MB. Never below 0. This is the graded figure.'),
      memoryAboveBaselineMb: S.number('The same in MB, and negative when the entry holds less than the do-nothing adapter.'),
      settledRssMb: S.number('All the memory the process holds after the task and a garbage collection, in MB.'),
      memoryKind: S.string('What the memory figures count.', { enum: ['footprint', 'rss'] }),
      peakRssMb: S.number('Highest resident size during the run, in MB.'),
      heapPeakMb: S.maybe('number', 'Highest heap the runtime reported, in MB.'),
      retainedKb: S.maybe('number', 'Heap still held after the last round, above the heap when the adapter was ready, in kB.'),
      heapAboveBaselineKb: S.maybe('number', 'Heap after the last round, above the do-nothing adapter, in kB.'),
      leakBytesPerOperation: S.maybe('number', 'Heap growth from the first round to the last, in bytes per operation.'),
      leakBytesPerRequest: S.maybe('number', 'Heap growth from the first round to the last, in bytes per request.'),
      importMs: S.maybe('number', 'Time to load the package, in ms.'),
      installBytes: S.maybe('integer', 'Size on disk once installed, in bytes; for Rust, what the crate adds to the compiled binary.'),
      installPackages: S.maybe('integer', 'Number of packages installed with it, itself included.'),
      installKind: S.maybe('string', '`install` for a size on disk, `binary` for a size added to a binary.'),
      throughputOps: S.integer('Operations per second of elapsed time.'),
      throughputRps: S.integer('Requests per second of elapsed time.'),
      latencyP50Ms: S.maybe('number', 'Median latency, in ms.'),
      latencyP99Ms: S.maybe('number', '99th percentile of latency, in ms.'),
    }, { required: ['memoryMb', 'settledRssMb', 'peakRssMb'] }),

    Grade: S.object('A class in one measure.', {
      class: { type: ['string', 'null'], enum: [...CLASS, null], description: 'Class from A (best) to G. Null for a reference entry.' },
      ratio: S.number('Multiple of the best result: 1 is the best, 2 costs twice as much.'),
      value: S.number('The graded figure, in the unit of the measure.'),
      reference: S.boolean('True for a reference entry, which has no class.'),
      overhead: S.object('For a framework, its multiple of the same runtime\'s server without a framework.', { ratio: S.number('Multiple of that server.'), title: S.string('Name of that server.') }),
    }, { required: ['class', 'ratio'] }),

    ResultRow: S.object('One result as a flat row: an entry on one runtime in one task. The CSV files have the same columns in the same order.', {
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
      cpu_unit: S.string('Unit of `cpu`: `µs per operation`, `µs per request` or `ms per start`.'),
      cpu: S.number('CPU time for one unit of work, in `cpu_unit`: user and system time, all threads.'),
      cpu_class: classCell('CPU'),
      cpu_times_best: S.orEmpty('number', 'CPU time as a multiple of the best result in the task.'),
      memory_mb: S.number('Memory held after the task and a garbage collection, above the do-nothing adapter, in MB.'),
      memory_class: classCell('memory'),
      memory_times_best: S.orEmpty('number', 'Memory as a multiple of the best result in the task.'),
      type_check_cost: S.orEmpty('number', 'Type-check cost, in MB·s: added compiler CPU time in seconds multiplied by added compiler memory in MB.'),
      type_check_class: classCell('type-check cost'),
      type_check_times_best: S.orEmpty('number', 'Type-check cost as a multiple of the lowest-cost package in the category.'),
      total_memory_after_gc_mb: S.number('All the memory the process holds after the task and a garbage collection, in MB.'),
      peak_memory_mb: S.number('Highest resident size during the run, in MB.'),
      heap_retained_kb: S.maybe('number', 'Heap still held after the last round, in kB.'),
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
    }, { required: ['category', 'task', 'ecosystem', 'package', 'entry', 'runtime', 'cpu_unit', 'cpu', 'memory_mb'] }),

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
const MEDIA = { json: 'application/json', csv: 'text/csv', md: 'text/markdown', svg: 'image/svg+xml', text: 'text/plain' }
const EMBED_SHAPES = 'The shapes: `overview.svg` (all measures on one label), `badge.svg` (one line; `badge.flat.svg` without shading), `badge.<measure>.svg` and `badge.<measure>.flat.svg`, `button.<measure>.svg`, `compact.<measure>.svg` and `wide.<measure>.svg`. A shape for `types` exists only when the entry has a type-check class.'

/**
 * The OpenAPI 3.1 description of the site's files.
 * Reads from `model`: `site.url`, `index` (edition, generatedAt, and as the
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
  // A name with slashes takes several segments of the address; OpenAPI has no
  // word for that, so such a parameter is marked.
  const spans = { 'x-multi-segment': true }

  const parameters = {
    category: param('category', 'Category id, as in `/data/index.json`.', id, ex.category),
    task: param('task', 'The task\'s name inside its category: the part of the task id after the slash.', id, ex.task),
    group: param('group', 'Id of a group of categories.', { type: 'string', enum: model.catalog.groups.map((g) => g.id) }, ex.group?.id),
    registry: param('registry', `Registry id: ${registries.map((r) => `\`${r}\` (${ECOSYSTEMS[r].title})`).join(', ')}.`, { type: 'string', enum: registries }, ex.registry),
    package: param('package', 'Package name, as its registry writes it. A scoped name (`@scope/name`) keeps its slash and takes two segments of the address. A measured Go module has a short name of its own; a Go module that is listed and not measured is named by its module path, slashes included.', { type: 'string' }, ex.pkg.name, spans),
    version: param('version', 'A version of the package that has results, as its registry writes it.', { type: 'string' }, ex.version),
    runtime: param('runtime', `Runtime id: ${model.runtimes.map((rt) => `\`${rt.id}\` (${rt.title})`).join(', ')}.`, { type: 'string', enum: model.runtimes.map((rt) => rt.id) }, ex.runtime.id),
    entry: param('entry', 'The entry\'s id without its registry: the package name, or the name of a variant of it. A scoped name keeps its slash. For a result kept for an earlier version, `@` and the version follow.', { type: 'string' }, ex.entryName, spans),
    result: param('result', 'The entry\'s name, then `@` and the version measured. A built-in has no version, so its name stands alone. A scoped name keeps its slash.', { type: 'string' }, ex.result, spans),
    adapter: param('adapter', 'The adapter\'s name in its registry\'s folder: most often the package name. A scoped name keeps its slash.', { type: 'string' }, ex.adapter, spans),
    measure: param('measure', 'The measure: `cpu` (CPU time), `memory`, or `types` (type-check cost).', { type: 'string', enum: measures }, 'cpu'),
    scope: param('scope', 'What the summary covers: `all` for every category, a category id, or a task id (`<category>/<task>`, two segments) in a category with more than one task.', { type: 'string' }, ex.scope, spans),
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
  // One address: its tag, an id, what it is, and what it answers with.
  function get(path, tag, operationId, summary, { description, media = 'json', schema, sample, returns, redirect } = {}) {
    if (used.has(operationId)) throw new Error(`two operations are called ${operationId}`)
    used.add(operationId)
    const names = [...path.matchAll(/\{(\w+)\}/g)].map(([, name]) => name)
    const content = { ...(schema ? { schema } : media === 'json' ? {} : { schema: { type: 'string' } }), ...(sample ? { 'x-sample': sample } : {}) }
    paths[path] = {
      get: {
        tags: [tag],
        operationId,
        summary,
        ...(description ? { description } : {}),
        ...(names.length ? { parameters: names.map((name) => ({ $ref: `#/components/parameters/${name === 'file' && path.startsWith('/embed/runtimes/') ? 'summaryFile' : name}` })) } : {}),
        responses: redirect
          ? { 308: { description: redirect, headers: { Location: { description: 'The full address of the result\'s page.', schema: { type: 'string', format: 'uri' } } } }, 404: { $ref: '#/components/responses/NotFound' } }
          : { 200: { description: returns ?? summary, content: { [MEDIA[media]]: content } }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    }
  }
  const rowsOf = (name) => ({ type: 'array', items: { $ref: `#/components/schemas/${name}` } })
  // A list in its three forms, at one base address.
  function list(base, tag, name, what, { schema, json, csv, markdown, keys, note } = {}) {
    if (json !== false) get(`${base}results.json`, tag, `${name}Json`, `${what}, as JSON.`, { description: note, schema: typeof schema === 'string' ? rowsOf(schema) : schema, sample: rowsSample(json, keys) })
    get(`${base}results.csv`, tag, `${name}Csv`, `${what}, as CSV.`, { description: json === false ? note : `The same rows as \`${base}results.json\`, with a heading row. ${note ?? ''}`.trim(), media: 'csv', sample: csvSample(csv ?? json) })
    get(`${base}index.md`, tag, `${name}Markdown`, `${what}, as Markdown.`, { description: 'The page in Markdown, with its tables.', media: 'md', sample: markdownSample(markdown) })
  }

  // Catalog
  get('/data/index.json', 'Catalog', 'getIndex', 'The tasks and categories that have results.', {
    description: 'Start here: each task names its data file, and the ids fill the `{category}` and `{task}` of the other addresses.',
    schema: S.ref('Index'),
    sample: jsonSample(pick(model.index, ['edition', 'generatedAt'], { categories: first(model.index.categories, 1, (c) => ({ ...c, summary: shorten(c.summary) })), tasks: first(model.index.tasks, 1, (t) => ({ ...t, summary: shorten(t.summary) })) })),
  })
  get('/data/catalog.json', 'Catalog', 'getCatalog', 'The listed packages that have no results yet.', {
    description: 'Packed as lists of values for the site\'s package table. `/packages/results.json` has every listed package with named fields.',
    schema: S.ref('Catalog'),
    sample: mostUsed ? jsonSample({
      registries: pick(Object.fromEntries(Object.entries(model.catalog.byEcosystem).map(([key, items]) => [key, { title: ECOSYSTEMS[key].title, measure: items[0]?.popularity.label ?? '' }])), [mostUsed.ecosystem], {}, ['registry', 'registries']),
      // The same nine values that scripts/build-site.mjs writes for a package.
      packages: first([[mostUsed.ecosystem, mostUsed.name, mostUsed.version ?? '', mostUsed.popularity.value, Number(mostUsed.share.toPrecision(4)), mostUsed.category?.title ?? '', mostUsed.category ? categoryHref(mostUsed.category.id, model) : '', mostUsed.rank, statusOf(mostUsed)]], 1, undefined, unmeasured.length),
    }) : undefined,
  })
  get('/search.json', 'Catalog', 'getSearchIndex', 'Every page the search box can find.', {
    description: 'Names and addresses of packages, tasks, categories, registries and runtimes. The site\'s own script reads this file, so its short field names can change with the site.',
    schema: S.ref('SearchIndex'),
    sample: jsonSample(first(found, 1, undefined, found.length)),
  })
  get('/llms.txt', 'Catalog', 'getLlmsText', 'A description of the site and a list of its Markdown pages, for language models.', { media: 'text', sample: markdownSample(exportsOf.llmsText(model, ECOSYSTEMS, ctx), 3) })
  get('/index.md', 'Catalog', 'getHomeMarkdown', 'The home page as Markdown.', { description: 'The same text as `/llms.txt`, with links to the indexes and to all results.', media: 'md' })

  // Tasks
  list('/tasks/', 'Tasks', 'getTasks', 'Every measured task', { schema: 'TaskRow', json: rows.tasks.rows, markdown: rows.tasks.markdown, keys: TASK_KEYS })
  get('/data/{category}/{task}.json', 'Tasks', 'getTaskData', 'Everything measured in one task.', {
    description: 'The scales and the best results that classes come from, and every entry on every runtime with all its figures, its classes and its adapter\'s notes. This is the file the task\'s page is drawn from.',
    schema: S.ref('TaskData'),
    sample: taskDataSample(ex.data, ex.runtime, ex.entry),
  })
  list('/{category}/{task}/', 'Tasks', 'getTaskResults', 'The results of one task', { json: false, csv: rows.task, markdown: exportsOf.taskMarkdown(ex.data, ctx), note: 'One row for each entry on each runtime. A task has no `results.json` here: its JSON is `/data/{category}/{task}.json`.' })
  get('/source/{category}/{task}/index.md', 'Tasks', 'getTaskSourceMarkdown', 'The benchmark source of one task, as Markdown.', { description: 'The rules of the task, its load settings and the scenario that checks every adapter, with a list of the adapters.', media: 'md', sample: markdownSample(exportsOf.taskSourceExport(ctx, ex.data).markdown, 3) })
  get('/source/{category}/{task}/{registry}/{adapter}/index.md', 'Tasks', 'getAdapterSourceMarkdown', 'The source of one adapter, as Markdown.', { description: 'The code that runs one package in the task, with who wrote it and its notes.', media: 'md', sample: markdownSample(exportsOf.adapterSourceExport(ctx, ex.data, ex.adapterId).markdown, 3) })

  // Categories
  list('/categories/', 'Categories', 'getCategories', 'Every category, measured or not', { schema: 'CategoryRow', json: rows.categories.rows, markdown: rows.categories.markdown, keys: CATEGORY_KEYS })
  if (rows.group) list('/categories/{group}/', 'Categories', 'getGroupCategories', 'The categories of one group', { schema: 'CategoryRow', json: rows.group.rows, markdown: rows.group.markdown, keys: CATEGORY_KEYS })
  list('/{category}/', 'Categories', 'getCategoryResults', 'One category', {
    schema: { anyOf: [rowsOf('ResultRow'), rowsOf('CatalogRow')] },
    json: rows.category.rows,
    markdown: rows.category.markdown,
    keys: ROW_KEYS,
    note: `A measured category answers with the results of all its tasks. A category that is not measured yet${ex.listedCategory ? ` (\`${ex.listedCategory.id}\`, for one)` : ''} answers with its listed packages, and has no \`results\` files when it lists none.`,
  })

  // Packages
  list('/packages/', 'Packages', 'getPackages', 'Every listed package, measured or not', { schema: 'CatalogRow', json: rows.packages.rows, markdown: rows.packages.markdown, keys: CATALOG_KEYS, note: 'The most used first. The figures of the measured ones are in `/data/results.json`.' })
  list('/{registry}/', 'Packages', 'getRegistryPackages', 'The packages of one registry', {
    schema: { anyOf: [rowsOf('CatalogRow'), rowsOf('ResultRow')] },
    json: rows.registry.rows,
    markdown: rows.registry.markdown,
    keys: CATALOG_KEYS,
    note: 'The listed packages of the registry. `builtin` has no list of its own, so it answers with the results of the runtime built-ins.',
  })
  list('/{registry}/{package}/', 'Packages', 'getPackageResults', 'The results of one measured package', {
    schema: 'ResultRow',
    json: rows.packageRows,
    markdown: exportsOf.packageMarkdown(ex.pkg, ECOSYSTEMS[ex.pkg.ecosystem].title, ctx),
    keys: ROW_KEYS,
    note: 'One row for each task and runtime it ran on, at the version it is ranked at. A package that is listed and not measured has `index.md` only.',
  })
  get('/{registry}/{package}/{version}/index.md', 'Packages', 'getPackageVersionMarkdown', 'One version of a measured package, as Markdown.', { description: 'The results of that version. The address without a version is the latest measured one.', media: 'md' })

  // Results
  for (const [base, name, same] of [['/data/', 'getAllResults', ''], ['/', 'getAllResultsAtRoot', ' The same file as under `/data/`.']]) {
    get(`${base}results.json`, 'Results', `${name}Json`, 'Every result of every task, as JSON.', { description: `One row for each entry on each runtime.${same}`, schema: rowsOf('ResultRow'), sample: same ? undefined : rowsSample(rows.task, ROW_KEYS, model.tasks.reduce((n, d) => n + d.runtimes.reduce((m, r) => m + r.entries.length, 0), 0)) })
    get(`${base}results.csv`, 'Results', `${name}Csv`, 'Every result of every task, as CSV.', { description: `The same rows, with a heading row.${same}`, media: 'csv' })
  }
  get('/results/{category}/{task}/{runtime}/{registry}/{result}/index.md', 'Results', 'getResultMarkdown', 'One result, as Markdown.', {
    description: 'An entry at one version on one runtime, with its figures and its adapter\'s source. The address stays the same when a newer version is measured, so it can be cited.',
    media: 'md',
    sample: markdownSample(exportsOf.resultExport(ctx, ex.data, ex.runtime, ex.entry, ex.address).markdown, 3),
  })
  get('/r/{code}', 'Results', 'followShortLink', 'The short link of a result.', { description: 'Redirects to the result\'s page, or to a runtime\'s summary page.', redirect: 'A redirect to the page the code stands for.' })
  get('/{code}', 'Results', 'followShortLinkAtRoot', 'The short link of a result, as labels print it.', { description: 'The same as `/r/{code}`. A page of the site at the same address comes first.', redirect: 'A redirect to the page the code stands for.' })

  // Runtimes
  list('/runtimes/', 'Runtimes', 'getRuntimes', 'Runtimes compared', { schema: 'RuntimeScoreRow', json: rows.runtimes.rows, markdown: rows.runtimes.markdown, keys: SCORE_KEYS, note: 'One row for each runtime in each scope: all categories, then each category.' })
  list('/runtimes/{runtime}/', 'Runtimes', 'getRuntimeResults', 'The results of one runtime', { schema: 'ResultRow', json: rows.runtime.rows, markdown: rows.runtime.markdown, keys: ROW_KEYS, note: 'Every entry that ran on it, in every task.' })
  get('/results/runtimes/{runtime}/{scope}/index.md', 'Runtimes', 'getRuntimeSummaryMarkdown', 'A runtime\'s summary in one scope, as Markdown.', { description: 'A short note that names the runtime and the scope, and points to the runtime\'s figures. It is the page a summary label links to.', media: 'md' })

  // Labels and embeds
  get('/labels/{category}/{task}/{runtime}/{registry}/{entry}.{measure}.svg', 'Labels and embeds', 'getLabel', 'The full label of one result, for one measure.', { description: 'There is no label for `types` when the entry has no type-check class.', media: 'svg', returns: 'The label, as an SVG image.' })
  get('/embed/{category}/{task}/{runtime}/{registry}/{entry}/{file}', 'Labels and embeds', 'getResultEmbed', 'A smaller shape of the label of one result.', { description: 'Follows the entry: it shows whichever version is measured now.', media: 'svg', returns: 'The shape, as an SVG image.' })
  get('/embed/{category}/{task}/{registry}/{package}/{file}', 'Labels and embeds', 'getPackageEmbed', 'A shape of the label of a package\'s best result in a task.', { description: 'The best result is the one with the lowest CPU class on any runtime, then the lowest memory.', media: 'svg', returns: 'The shape, as an SVG image.' })
  get('/embed/runtimes/{runtime}/{scope}/{basis}/{file}', 'Labels and embeds', 'getRuntimeSummaryEmbed', 'A runtime\'s summary label in one scope.', { description: 'A running summary: it changes as tasks are added.', media: 'svg', returns: 'The label or shape, as an SVG image.' })

  return {
    openapi: '3.1.0',
    info: {
      title: 'Package Efficiency Labels',
      summary: 'Efficiency classes from A to G for software packages, as files.',
      description: [
        `The results of ${site.replace(/^https?:\/\//, '')} as files: JSON, CSV, Markdown and SVG labels. Every address answers a plain GET (or HEAD) and needs no key. The files are written when the site is built, so there are no query parameters, no paging and no filtering: take the file and filter it yourself. This description was made from the data of ${day}.`,
        'Names in addresses. A name appears as its registry writes it. A scoped name (`@scope/name`) and a Go module path contain slashes, and each slash is a separator of the address like any other: do not write it as `%2F`. Write `@` as it is, and follow redirects: for a file that the build wrote, the server answers an address that has `@` with a redirect to the same address with `%40`. The files that are put together on request (single results, labels, embeds, adapter source, packages that are not measured) answer only to `@` as it is. A parameter that can take more than one segment is marked `x-multi-segment`.',
        'Two families of addresses have the same shape: `/{category}/…` and `/{registry}/…`, and under them `/{category}/{task}/…` and `/{registry}/{package}/…`. The first segment tells them apart: it is a registry id, or else a category id. No category has the id of a registry.',
        'Figures. CPU is CPU time for one unit of work, in µs per operation or per request (ms per start in a startup task). Memory is in MB, above the same runtime with a do-nothing adapter. Type-check cost is in MB·s. A class goes from A (best) to G, and a "times best" figure is a multiple of the best result: 1 is the best. The results are provisional and come from one machine.',
        'Each media type object may carry `x-sample`: a real response cut short, as text, for the reference page.',
      ].join('\n\n'),
      version: `${model.index.edition}+${day.replace(/-/g, '')}`,
    },
    externalDocs: { description: 'The reference page', url: `${site}/api/` },
    servers: [{ url: site }],
    tags: TAGS.map(([name, description]) => ({ name, description })),
    paths,
    components: {
      parameters,
      responses: { NotFound: { description: 'No file at this address. The body is the site\'s "not found" page.', content: { 'text/html': { schema: { type: 'string' } } } } },
      schemas: schemasOf(model),
    },
  }
}

// --- The page -------------------------------------------------------------------

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// `code` in a description becomes <code>.
const prose = (text) => esc(text).replace(/`([^`]+)`/g, '<code>$1</code>')
const deref = (spec, node) => (node?.$ref ? node.$ref.slice(2).split('/').reduce((at, key) => at[key], spec) : node)
const refName = (node) => node?.$ref?.split('/').at(-1)

// A path with its example values in place.
export function exampleAddress(spec, path) {
  const declared = (spec.paths[path].get.parameters ?? []).map((p) => deref(spec, p))
  return path.replace(/\{(\w+)\}/g, (_, name) => String(declared.find((p) => p.name === name).example))
}

// A schema's type in a few words, with links to the named schemas.
function typeText(schema) {
  if (!schema) return ''
  if (schema.$ref) return `<a href="#schema-${slug(refName(schema))}">${esc(refName(schema))}</a>`
  if (schema.anyOf) return schema.anyOf.map(typeText).join(' or ')
  if (schema.type === 'array') return `list of ${schema.prefixItems ? 'values' : typeText(schema.items) || 'values'}`
  if (schema.type === 'object' && schema.additionalProperties && !Object.keys(schema.properties ?? {}).length) return `map of ${typeText(schema.additionalProperties) || 'values'}`
  return esc([schema.type ?? 'any'].flat().join(' or '))
}
const table = (kind, head, body) => `<div class="scroll"><table class="api-table api-${kind}"><thead><tr>${head.map((h) => `<th scope="col"${h === head[0] ? '' : ' class="l"'}>${h}</th>`).join('')}</tr></thead><tbody>\n${body.join('\n')}\n</tbody></table></div>`
const oneOf = (schema) => (schema.enum ? ` One of ${schema.enum.filter((v) => v !== '' && v !== null).map((v) => `<code>${esc(v)}</code>`).join(', ')}.` : '')

// The fields of a schema, an object inside it written as `outer.inner`.
function fieldRows(schema, prefix = '') {
  const required = new Set(schema.required ?? [])
  return Object.entries(schema.properties ?? {}).flatMap(([name, field]) => {
    const inner = field.type === 'array' ? field.items : field
    const nested = !inner.$ref && inner.type === 'object' && Object.keys(inner.properties ?? {}).length ? fieldRows(inner, `${prefix}${name}${field.type === 'array' ? '[]' : ''}.`) : []
    const mapped = !inner.$ref && inner.type === 'object' && inner.additionalProperties?.properties ? fieldRows(inner.additionalProperties, `${prefix}${name}.*.`) : []
    const described = field.description && !/One of|: `/.test(field.description) && field.enum && field.enum.length <= 8 && !/class|medal/i.test(name) ? oneOf(field) : ''
    return [`<tr><td><code>${esc(prefix + name)}</code>${required.has(name) || prefix ? '' : ' <span class="soft">optional</span>'}</td><td class="l api-type">${typeText(field)}</td><td class="l api-wrap">${prose(field.description ?? '')}${described}</td></tr>`, ...nested, ...mapped]
  })
}

function operationHtml(spec, path, op) {
  const params = (op.parameters ?? []).map((p) => deref(spec, p))
  const status = op.responses[200] ? 200 : 308
  const answer = op.responses[status]
  const [media, content] = Object.entries(answer.content ?? {})[0] ?? []
  const address = encodeURI(exampleAddress(spec, path))
  const full = `${spec.servers[0].url}${address}`
  const shown = esc(path).replace(/\{(\w+)\}/g, '<span class="api-param">{$1}</span>')
  const schema = content?.schema
  const named = schema && (schema.$ref || schema.items?.$ref || schema.anyOf)
  const returns = status === 308
    ? `Answers <code>308</code> with the page's address in <code>Location</code>, and <code>404</code> for a code that was not given out.`
    : `Returns <code>${esc(media)}</code>${named ? `: ${typeText(schema)}` : ''}. An address that does not exist answers <code>404</code>.`
  const figure = media === MEDIA.svg ? `<p><img class="api-figure" src="${esc(address)}" alt="The example: ${esc(op.summary.replace(/\.$/, ''))}" loading="lazy"></p>` : ''
  return `<section class="api-op" id="${esc(slug(op.operationId))}">
<h3 class="api-sig"><span class="api-method">GET</span> <code class="api-path">${shown}</code></h3>
<p>${prose(op.summary)}${op.description ? ` ${prose(op.description)}` : ''}</p>
${params.length ? table('params', ['Parameter', 'Type', 'Description', 'Example'], params.map((p) => `<tr><td><code>${esc(p.name)}</code></td><td class="l api-type">${typeText(p.schema)}</td><td class="l api-wrap">${prose(p.description)}${p['x-multi-segment'] ? ' <span class="soft">Can take more than one segment.</span>' : ''}</td><td class="l"><code>${esc(p.example)}</code></td></tr>`)) : ''}
<p class="api-returns">${returns}</p>
${content?.['x-sample'] ? `<pre class="api-sample" tabindex="0" aria-label="Example response, cut short"><code>${esc(content['x-sample'])}</code></pre>` : ''}${figure}
<p class="api-curl"><code>curl ${status === 308 ? '-sI' : '-sL'} ${esc(full)}</code><button type="button" class="api-copy" hidden>Copy</button></p>
</section>`
}

// Copies the command beside a button. Without scripts the buttons stay hidden,
// and a click on a command selects all of it.
const COPY_SCRIPT = `<script>
for (const button of document.querySelectorAll('.api-copy')) {
  if (!navigator.clipboard) break
  button.hidden = false
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(button.previousElementSibling.textContent)
    button.textContent = 'Copied'
    setTimeout(() => { button.textContent = 'Copy' }, 1500)
  })
}
</script>`

/**
 * The reference page, drawn from `openApiSpec(model)`. Returns the page's
 * title and description, and `body`: the HTML that goes inside <main>.
 * Pass `spec` when it is already made, so that it is not worked out twice.
 */
export function apiPage(model, spec = openApiSpec(model)) {
  const ex = examplesOf(model)
  const site = spec.servers[0].url
  const groups = spec.tags.map((tag) => ({ ...tag, operations: Object.entries(spec.paths).filter(([, item]) => item.get.tags[0] === tag.name) })).filter((group) => group.operations.length)
  const count = groups.reduce((n, group) => n + group.operations.length, 0)
  const day = new Date(model.index.generatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const at = (path) => `<a href="${esc(encodeURI(path))}"><code>${esc(path)}</code></a>`
  const names = [
    ex.scoped ? `<li>A scoped package keeps its slash: <code>${esc(ex.scoped.name)}</code> is at ${at(`${urls.package(ex.scoped)}results.json`)}.</li>` : '',
    ex.goMeasured ? `<li>A measured Go module has a short name of its own: <code>${esc(ex.goMeasured.module)}</code> is at ${at(`${urls.package(ex.goMeasured)}results.json`)}. The field <code>module</code> of its entries has the path.</li>` : '',
    ex.goListed ? `<li>A Go module that is listed and not measured is named by its path, with its slashes: ${at(`/${ex.goListed.ecosystem}/${ex.goListed.name}/index.md`)}.</li>` : '',
    `<li>Do not write a slash of a name as <code>%2F</code>. Each one is a separator of the address like any other.</li>`,
    `<li>Write <code>@</code> as it is, and follow redirects (<code>curl -L</code>). For a file that the build wrote, the server answers an address that has <code>@</code> with a redirect to the same address with <code>%40</code>. The files that are put together on request (single results, labels, embeds, adapter source, packages that are not measured) answer both spellings.</li>`,
    `<li>An address of a page ends in a slash. Without it, the server redirects to the address with it.</li>`,
  ].filter(Boolean)

  const body = `<h1>API</h1>
<p class="intro">Every page of results is also published as files at regular addresses: JSON, CSV, Markdown, and the labels as SVG images. This page lists the ${count} kinds of address. The same list is in <a href="/openapi.json"><code>/openapi.json</code></a>, an OpenAPI 3.1 description, and this page is drawn from it.</p>

<h2 id="api-basics">Basics</h2>
<div class="scroll"><table class="api-table api-facts"><tbody>
<tr><th scope="row">Base address</th><td class="l api-wrap"><code>${esc(site)}</code></td></tr>
<tr><th scope="row">Requests</th><td class="l api-wrap"><code>GET</code> and <code>HEAD</code> only. No key, no account, no query parameters.</td></tr>
<tr><th scope="row">Files</th><td class="l api-wrap">Written when the site is built, not worked out for each request. There is no paging and no filtering: take the file and filter it yourself. The data here is of ${esc(day)}, edition ${esc(model.index.edition)}.</td></tr>
<tr><th scope="row">Other sites</th><td class="l api-wrap">The server sends no CORS headers, so a script on another site cannot read these files in a browser. A label works on any site as an image.</td></tr>
<tr><th scope="row">Caching</th><td class="l api-wrap">Labels, embeds, single results and the other files that are put together on request can be kept for five minutes (<code>max-age=300</code>).</td></tr>
<tr><th scope="row">Errors</th><td class="l api-wrap">An address that does not exist answers <code>404</code> with the site's "not found" page as HTML, also where JSON was asked for.</td></tr>
<tr><th scope="row">Status</th><td class="l api-wrap">Provisional. All results come from one developer laptop, and the fields can change as the site does.</td></tr>
</tbody></table></div>
<p>A good place to start is ${at('/data/index.json')}: it lists every task and category, and its ids fill the <code>{category}</code> and <code>{task}</code> of the other addresses. Every result of every task, as flat rows, is in ${at('/data/results.json')}.</p>

<h2 id="api-names">Names in addresses</h2>
<p>A name appears in an address as its registry writes it.</p>
<ul>
${names.join('\n')}
</ul>
<p>Two families of addresses have the same shape: <code>/{category}/…</code> and <code>/{registry}/…</code>. The first segment tells them apart: it is a registry id (${Object.keys(ECOSYSTEMS).map((id) => `<code>${id}</code>`).join(', ')}), or else a category id. No category has the id of a registry.</p>

<h2 id="api-figures">Figures</h2>
<ul>
<li>CPU is CPU time for one unit of work: µs of CPU per operation or per request, and ms per start in a startup task. It counts user and system time on all threads.</li>
<li>Memory is in MB: what the process holds after the task and a garbage collection, above the same runtime with a do-nothing adapter on the same inputs.</li>
<li>Type-check cost is in MB·s: added compiler CPU time in seconds multiplied by added compiler memory in MB.</li>
<li>A class goes from A (best) to G. It says how many times the best result an entry costs.</li>
<li>A "times best" figure, or <code>ratio</code>, is that multiple of the best: 1 is the best, 2 costs twice as much.</li>
</ul>

${groups.map((group) => `<h2 id="${slug(group.name)}">${esc(group.name)}</h2>
<p>${prose(group.description)}</p>
<ul class="api-list">
${group.operations.map(([path, item]) => `<li><a href="#${esc(slug(item.get.operationId))}"><code>${esc(path)}</code></a></li>`).join('\n')}
</ul>
${group.operations.map(([path, item]) => operationHtml(spec, path, item.get)).join('\n')}`).join('\n\n')}

<h2 id="fields">Fields</h2>
<p>What the JSON files hold. A field marked optional is missing where it does not apply. A file can have more fields than are listed here.</p>
${Object.entries(spec.components.schemas).map(([name, schema]) => {
    const object = schema.type === 'array' ? schema.items : schema
    return `<section class="api-schema" id="schema-${slug(name)}">
<h3><code>${esc(name)}</code></h3>
<p>${prose(schema.description ?? '')}${schema.type === 'array' ? ' Each item:' : ''}</p>
${table('fields', ['Field', 'Type', 'Description'], fieldRows(object))}
</section>`
  }).join('\n')}
${COPY_SCRIPT}`

  return {
    title: 'API: Package Efficiency Labels',
    description: 'The addresses of the JSON, CSV, Markdown and SVG files behind every page of results, with their parameters, fields and units.',
    body,
  }
}

// The page's own menu, shown where the other pages have the catalog: the
// sections of the introduction, then every address under its group.
export function apiSideNav(spec) {
  const groups = spec.tags.map((tag) => ({ ...tag, operations: Object.entries(spec.paths).filter(([, item]) => item.get.tags[0] === tag.name) })).filter((group) => group.operations.length)
  return `<h2><a href="#api-basics">Basics</a></h2>
<ul><li><a href="#api-names">Names in addresses</a></li><li><a href="#api-figures">Figures</a></li><li><a href="/openapi.json">openapi.json</a></li></ul>
${groups.map((group) => `<h2><a href="#${slug(group.name)}">${esc(group.name)}</a></h2>
<ul>${group.operations.map(([path, item]) => `<li><a href="#${esc(slug(item.get.operationId))}" title="${esc(item.get.summary ?? path)}"><code>${esc(path)}</code></a></li>`).join('')}</ul>`).join('\n')}
<h2><a href="#fields">Fields</a></h2>`
}
