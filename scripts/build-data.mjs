// Compile raw results into the normalized, graded data the site consumes.
// Writes dist/data/index.json and dist/data/<category>/<task>.json.
// Usage: node scripts/build-data.mjs
import { ecosystem, ecosystemIds } from './lib/ecosystems.mjs'
import { releaseState, releaseEntryId } from './lib/releases.mjs'
import { globSync } from 'node:fs'
import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fromRoot, median, readJson, writeJson } from './lib/util.mjs'

// Every size on the site is decimal: 1 MB is 1,000,000 bytes and 1 KB is
// 1,000. Measurements arrive in bytes, except two files that store binary
// megabytes (2^20 bytes) and are converted with MIB_TO_MB.
const MB = 1e6
const KB = 1e3
const MIB_TO_MB = 2 ** 20 / MB

// Default class boundaries, as multiples of the task's best result: A is
// within 1.5x of the best, G is more than 50x. A metric whose entries sit
// closer together sets its own, tighter `scale` in task.json, the way each
// appliance group has its own label thresholds. Boundaries closer than about
// 1.25x apart are below the current run-to-run noise.
const DEFAULT_RATIO_SCALE = [1.5, 3, 6, 12, 25, 50]
// Type-check memory applies to every package, not to a task, so it uses
// absolute boundaries in MB. Provisional: set from a small sample.
// Type-check cost is the geometric mean of time added and memory added: the
// square root of ms × MB. A plain product would square the spread, since the
// two rise together. Like CPU and memory it is graded as a multiple of the
// best entry in the task, separately for each compiler. Time below `timeFloorMs` is run-to-run noise
// and counts as the floor.
const TYPES_METRIC = {
  unit: '',
  headline: 'type-check cost, √(CPU ms × MB)',
  absolute: false,
  scale: DEFAULT_RATIO_SCALE,
  floor: 1,
  timeFloorMs: { tsc: 10, tsgo: 10 },
}
// Rust type checking is a different tool with different costs, so crates are
// graded only against each other: multiples of the best crate in the task.
const CARGO_CHECK_METRIC = { unit: '', headline: 'cargo check cost, √(CPU ms × MB)', scale: DEFAULT_RATIO_SCALE, absolute: false, floor: 1 }
// The compiler the type-check class is based on.
const TYPES_COMPILER = 'tsgo'
// Retained heap growing faster than this per request is flagged as a leak.
const LEAK_BYTES_PER_REQUEST = 8

const CLASSES = 'ABCDEFG'
const classFor = (value, scale) => CLASSES[scale.findIndex((limit) => value <= limit)] ?? 'G'
const round = (n, digits = 1) => (n === null || n === undefined ? null : Number(n.toFixed(digits)))
const stripAnsi = (text) => text?.replace(/\u001b\[[\d;]*m/g, '') ?? null

// One number per measurement: the median across rounds, then across runs.
function summarize(result, baseline) {
  const perRun = (fn) => median(result.runs.map(fn))
  const perRound = (fn) => perRun((run) => median(run.rounds.map(fn)))
  const baseHeap = median(baseline.runs.map(r => r.heapUsedBytes))
  const baseRss = median(baseline.runs.map((r) => r.rssBytes))

  const operations = result.runs[0].rounds[0].operations !== undefined
  const count = (r) => r.operations ?? r.requests
  const cpuPerRequestUs = perRound((r) => (r.cpuMs * 1000) / count(r))
  const leak = perRun((run) => {
    const first = run.rounds[0]
    const last = run.rounds.at(-1)
    return first.heapUsedBytes == null || last.heapUsedBytes == null ? null : (last.heapUsedBytes - first.heapUsedBytes) / (run.rounds.slice(1).reduce((n, r) => n + count(r), 0) || Infinity)
  })
  const heapPeak = perRun((r) => r.heap.peakBytes)

  return {
    metrics: {
      [operations ? 'cpuPerOperationUs' : 'cpuPerRequestUs']: round(cpuPerRequestUs, operations ? 4 : 1),
      [operations ? 'operationsPerCpuSecond' : 'requestsPerCpuSecond']: Math.round(1e6 / cpuPerRequestUs),
      memoryMb: round(Math.max(0, (perRun((r) => r.rssAfterLoadBytes) - baseRss) / MB)),
      memoryAboveBaselineMb: round((perRun((r) => r.rssAfterLoadBytes) - baseRss) / MB),
      settledRssMb: round(perRun((r) => r.rssAfterLoadBytes) / MB),
      peakRssMb: round(perRun((r) => r.peakRssBytes) / MB),
      heapPeakMb: round(heapPeak === null ? null : heapPeak / MB, 2),
      retainedKb: round(perRun((r) => r.rounds.at(-1).heapUsedBytes == null || r.heap.readyBytes == null ? null : (r.rounds.at(-1).heapUsedBytes - r.heap.readyBytes) / KB), 0),
      heapAboveBaselineKb: baseHeap === null ? null : round(perRun(r => r.rounds.at(-1).heapUsedBytes == null ? null : (r.rounds.at(-1).heapUsedBytes - baseHeap) / KB), 1),
      [operations ? 'leakBytesPerOperation' : 'leakBytesPerRequest']: round(leak, 2),
      importMs: round(perRun((r) => r.importMs)),
      [operations ? 'throughputOps' : 'throughputRps']: Math.round(perRound((r) => (count(r) * 1000) / r.wallMs)),
      latencyP50Ms: round(perRound((r) => r.latencyP50Ms), 2),
      latencyP99Ms: round(perRound((r) => r.latencyP99Ms), 2),
    },
    flags: leak > LEAK_BYTES_PER_REQUEST ? ['grows-with-use'] : [],
  }
}

const config = await readJson(fromRoot('runtimes.json'))
const types = await readJson(fromRoot('data/types.json'), { compilers: {}, packages: {} })
// The version of each npm package that the edition ranks. Results for other
// versions are kept as that package's history.
const versionPins = await readJson(fromRoot('versions.json'), {npm:{},jsr:{}})
const pinned = versionPins.npm
const nativeChecks = await readJson(fromRoot('data/native-checks.json'), { checkers: {}, adapters: {} })
const rustCheck = await readJson(fromRoot('data/rust-check.json'), { rust: null, crates: {} })

function typeCheck(typesPackage, version) {
  const current = types.packages[typesPackage]
  const typed = !version || current?.version === version ? current : types.versions?.[typesPackage]?.[version]
  if (typed?.status !== 'ok') return null
  const compilers = {}
  for (const id of Object.keys(types.compilers)) {
    if (!typed[id]) {
      compilers[id] = null
      continue
    }
    // Small packages can measure below the empty baseline, in time or (for
    // the JavaScript compiler, whose memory depends on its GC) in memory.
    // TypeScript reports memory in thousands of bytes.
    const memoryMb = round(Math.max(0, typed[id].memoryKb) / 1000, 2)
    const timeMs = round(Math.max(0, typed[id].timeMs), 1)
    const cpuMs = round(Math.max(0, typed[id].cpuMs ?? 0), 1)
    const score = typed[id].cpuMs === undefined ? null : round(Math.sqrt(memoryMb * Math.max(cpuMs, TYPES_METRIC.timeFloorMs[id] ?? 10)), 1)
    compilers[id] = { timeMs, cpuMs, memoryMb, score, symbols: typed[id].symbols, files: typed[id].files }
  }
  return {
    package: typesPackage,
    from: typed.typesFrom === 'self' ? `${typesPackage}@${typed.version}` : typed.typesFrom,
    compilers,
    value: compilers[TYPES_COMPILER]?.score ?? null,
  }
}

// The same cost for a Rust adapter: what re-checking it adds over an empty program.
function cargoCheck(stored) {
  // data/rust-check.json holds binary megabytes.
  const checked = { ...stored, addedMb: round(stored.addedMb * MIB_TO_MB, 1) }
  const timeMs = Math.max(0, checked.warmWallMs - rustCheck.baseline.warmWallMs)
  const cpuMs = Math.max(0, (checked.warmCpuMs ?? 0) - (rustCheck.baseline.warmCpuMs ?? 0))
  return { tool: 'cargo', value: checked.warmCpuMs === undefined ? null : round(Math.sqrt(checked.addedMb * Math.max(cpuMs, 10)), 1), timeMs, cpuMs, memoryMb: checked.addedMb, coldCpuS: checked.coldCpuS }
}

// Every build starts from an empty dist/, so nothing stale is ever deployed.
// The folder itself is kept, so a preview server running in it keeps working.
await mkdir(fromRoot('dist'), { recursive: true })
for (const name of await readdir(fromRoot('dist'))) await rm(fromRoot('dist', name), { recursive: true, force: true })

const generatedAt = new Date().toISOString()
const index = { edition: config.edition, generatedAt, compilers: types.compilers, categories: [], tasks: [], planned: [] }

for (const taskFile of globSync('benchmarks/*/*/task.json', { cwd: fromRoot() }).sort()) {
  const task = await readJson(fromRoot(taskFile))
  const taskId = `${task.category}/${task.task}`
  const taskDir = fromRoot(path.dirname(taskFile))
  const runtimes = {}
  let machine = null

  for (const file of globSync('**/*.json', { cwd: fromRoot('results', taskId) })) {
    const result = await readJson(fromRoot('results', taskId, file))
    const baseline = result.baseline ?? await readJson(fromRoot('results/_baseline', `${result.runtime}.json`))
    const sharedAdapter = await readJson(path.join(taskDir, result.ecosystem, result.package, 'adapter.json'))
    const adapter = {...sharedAdapter,...sharedAdapter.versions?.[result.version]}
    machine ??= result.machine

    const runtime = (runtimes[result.runtime] ??= {
      id: result.runtime,
      title: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).title,
      version: result.runtimeVersion,
      language: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).language ?? (result.runtime === 'rust' ? 'rust' : 'javascript'),
      heapDescription: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).heapDescription ?? 'Runtime-reported heap plus external allocations (Rust: counted live allocations).',
      baselineHeapKb: round(median(baseline.runs.map(r => r.heapUsedBytes)) === null ? null : median(baseline.runs.map(r => r.heapUsedBytes)) / KB),
      baselineMb: round(median(baseline.runs.map((r) => r.rssBytes)) / MB),
      entries: [],
      // Other versions of ranked packages: graded on the same scale, never ranked.
      history: [],
      // Adapters that could not start here. Kept for the record, never ranked.
      unsupported: [],
    })
    const release = releaseState(versionPins,result.ecosystem,result.package,result.version)
    const id = releaseEntryId(result.ecosystem,result.package,result.version,release)
    const isCurrent = release.active
    if (result.status !== 'ok') {
      runtime.unsupported.push({ id, package:adapter.package ?? result.package, ecosystem:result.ecosystem, version:result.version, title:adapter.title ?? result.package, status:result.status, notes:adapter.runtimeNotes?.[result.runtime] ?? null, error:stripAnsi(result.error)?.replaceAll(fromRoot(), '[workspace]') })
      continue
    }

    const checked = rustCheck.crates[`${taskId}/cargo/${result.package}`]
    // data/native-checks.json holds binary megabytes.
    const storedNative = nativeChecks.adapters[`${taskId}/${result.ecosystem}/${result.package}`]
    const native = storedNative && { ...storedNative, memoryMb: storedNative.memoryMb * MIB_TO_MB }
    const nativeInfo = native && {
      tool: native.tool, metricKey: native.language, language: native.language,
      icon: { python: 'cpython', ruby: 'ruby', go: 'go' }[native.language],
      version: native.version, notes: nativeChecks.checkers[native.language].notes,
      cpuMs: round(native.cpuMs, 2), timeMs: round(native.timeMs, 2), memoryMb: round(native.memoryMb, 3),
      value: round(Math.sqrt(native.memoryMb * Math.max(native.cpuMs, 10)), 2),
    }
    const typeInfo =
      nativeInfo ? nativeInfo
        : result.ecosystem !== 'cargo'
        ? typeCheck(adapter.types ?? adapter.package ?? result.package, adapter.types ? null : result.version)
        : checked && cargoCheck(checked)
    ;(isCurrent ? runtime.entries : runtime.history).push({
      id,
      ecosystem: result.ecosystem,
      name: result.package,
      // Variants of one package (for example a non-default configuration)
      // are separate adapters that share a `package`.
      package: adapter.package ?? result.package,
      title: adapter.title ?? result.package,
      version: result.version ?? null,
      defaultVersion: release.primary,
      activeRelease: release.active,
      builtin: result.ecosystem === 'builtin',
      ...summarize(result, baseline),
      grades: {},
      measurement: { runs: result.runs.length, roundsPerRun: result.runs.map((r) => r.rounds.length), warmupRoundsPerRun: result.runs.map(r => r.warmupRounds?.length ?? 0), harness: result.harness },
      adapter: {
        author: adapter.author,
        review: adapter.review,
        tags: adapter.tags ?? [],
        notes: [adapter.notes, result.harness < 2 ? 'Historical measurement: predates the full same-process warm-up; not directly comparable with current measurements.' : null].filter(Boolean).join(' ') || null,
        runtimeNotes: adapter.runtimeNotes ?? {},
        dependencies: Object.entries(result.dependencies ?? {})
          .filter(([name]) => name !== result.package)
          .map(([name, version]) => `${name}@${version}`),
      },
      types: typeInfo,
    })
  }

  // Class A is set by the best result for the task in any language or
  // runtime, so a class means the same thing everywhere it appears.
  const metrics = {}
  for (const [metricId, spec] of Object.entries(task.metrics)) {
    const floor = spec.floor ?? 0
    const scale = spec.scale ?? DEFAULT_RATIO_SCALE
    const value = (entry) => Math.max(entry.metrics[spec.key], floor)
    const all = Object.values(runtimes).flatMap((runtime) => runtime.entries.map((entry) => ({ entry, runtime })))
    if (all.length === 0) continue
    const best = all.reduce((a, b) => (value(a.entry) <= value(b.entry) ? a : b))
    const others = Object.values(runtimes).flatMap((runtime) => runtime.history)
    for (const entry of [...all.map((a) => a.entry), ...others]) {
      const ratio = value(entry) / value(best.entry)
      entry.grades[metricId] = { class: classFor(ratio, scale), ratio: round(ratio, 2), value: entry.metrics[spec.key] }
    }
    metrics[metricId] = {
      unit: spec.unit,
      headline: spec.headline,
      scale,
      floor,
      anchor: { id: best.entry.id, title: best.entry.title, version: best.entry.version, runtime: best.runtime.title, value: value(best.entry) },
    }
  }
  // Runtime comparisons include the runtime itself; package comparisons
  // describe incremental cost over that runtime's empty process.
  const totalMemoryEntries = Object.values(runtimes).flatMap(runtime => runtime.entries)
  const totalMemoryBest = Math.min(...totalMemoryEntries.map(entry => entry.metrics.settledRssMb))
  for (const runtime of Object.values(runtimes)) {
    for (const entry of [...runtime.entries, ...runtime.history]) {
      const ratio = entry.metrics.settledRssMb / totalMemoryBest
      entry.runtimeGrades = { memory: { class: classFor(ratio, metrics.memory.scale), ratio: round(ratio, 2), value: entry.metrics.settledRssMb } }
    }
  }
  const runtimeMetrics = { memory: { ...metrics.memory, headline: 'MB after task and GC', floor: 0, anchor: { value: totalMemoryBest } } }
  // Type-check cost is graded like CPU and memory: against the best result in
  // the task from any language, whichever checker produced it. The scores share
  // a unit, so a class means the same on every tab. A built-in adds nothing to
  // a check (its runtime's types are already loaded), so the best package sets
  // class A; built-ins are still graded, and come out as A.
  const everyEntry = Object.values(runtimes).flatMap((runtime) => runtime.entries)
  const everyVersion = [...everyEntry, ...Object.values(runtimes).flatMap((runtime) => runtime.history)]
  const typeValue = (score) => Math.max(score, TYPES_METRIC.floor)
  const scored = everyEntry.filter((e) => e.types?.value != null)
  const typeChecks = { typescript: { ...TYPES_METRIC, tool: `TypeScript ${types.compilers[TYPES_COMPILER]}` } }
  if (rustCheck.rust) typeChecks.cargo = { ...CARGO_CHECK_METRIC, tool: `cargo check, Rust ${rustCheck.rust}` }
  for (const [language, checker] of Object.entries(nativeChecks.checkers)) {
    if (everyEntry.some((e) => e.types?.metricKey === language)) typeChecks[language] = { ...TYPES_METRIC, tool: `${checker.tool} ${checker.version}`, notes: checker.notes }
  }
  if (scored.length) {
    const packages = scored.filter((e) => !e.builtin)
    const best = (packages.length ? packages : scored).reduce((a, b) => (typeValue(a.types.value) <= typeValue(b.types.value) ? a : b))
    const bestValue = typeValue(best.types.value)
    const grade = (score) => {
      const ratio = Math.max(1, typeValue(score) / bestValue)
      return { class: classFor(ratio, TYPES_METRIC.scale), ratio: round(ratio, 2) }
    }
    for (const e of everyVersion) {
      if (e.types?.value != null) e.grades.types = { ...grade(e.types.value), value: e.types.value }
      // Each TypeScript compiler's own figure is graded on the same scale.
      for (const compiler of Object.values(e.types?.compilers ?? {})) {
        if (compiler?.score != null) Object.assign(compiler, grade(compiler.score))
      }
    }
    const tool = typeChecks[best.types.metricKey ?? (best.ecosystem === 'cargo' ? 'cargo' : 'typescript')]?.tool
    const anchor = { title: best.title, version: best.version, tool, value: bestValue }
    for (const check of Object.values(typeChecks)) check.anchor = anchor
  }

  const order = [...Object.keys(config.runtimes), ...Object.keys(config.toolchains)]
  const data = {
    edition: config.edition,
    generatedAt,
    machine,
    task: { id: taskId, ...task },
    reference: config.reference,
    metrics,
    runtimeMetrics,
    typeChecks,
    compilers: types.compilers,
    typesCompiler: TYPES_COMPILER,
    runtimes: order.filter((id) => runtimes[id]).map((id) => runtimes[id]),
  }
  for (const runtime of data.runtimes) {
    runtime.entries.sort((a, b) => a.grades.cpu.value - b.grades.cpu.value || a.title.localeCompare(b.title))
  }
  await writeJson(fromRoot('dist/data', `${taskId}.json`), data)

  if (!index.categories.some((c) => c.id === task.category)) {
    index.categories.push({ id: task.category, ...(await readJson(fromRoot('benchmarks', task.category, 'category.json'))) })
  }
  index.tasks.push({ id: taskId, category: task.category, title: task.title, summary: task.summary, data: `data/${taskId}.json` })
  console.log(`dist/data/${taskId}.json: ${data.runtimes.map((r) => `${r.id} ${r.entries.length}`).join(', ')}`)
}

// Categories from the categorization run that have no benchmark yet.
const taxonomy = await readJson(fromRoot('data/taxonomy.json'), { categories: [] })
// Every ecosystem that has been categorized counts towards a category's size.
const assigned = []
for (const id of ecosystemIds) assigned.push(...Object.values(await readJson(fromRoot(ecosystem(id).categories), {})))
const covered = new Set(index.categories.map((c) => c.taxonomy))
index.planned = taxonomy.categories
  .filter((c) => c.benchmarkable && !covered.has(c.id))
  .map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    benchmarkIdea: c.benchmarkIdea ?? null,
    packages: assigned.filter((a) => a.category === c.id).length,
  }))
  .sort((a, b) => b.packages - a.packages || a.title.localeCompare(b.title))

await writeJson(fromRoot('dist/data/index.json'), index)
