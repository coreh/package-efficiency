// Compile raw results into the normalized, graded data the site consumes.
// Writes dist/data/index.json and dist/data/<category>/<task>.json.
// Usage: node scripts/build-data.mjs
import { ecosystem, ecosystemIds, goPackageName } from './lib/ecosystems.mjs'
import { releaseState, releaseEntryId } from './lib/releases.mjs'
import { globSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fromRoot, median, readJson, writeJson } from './lib/util.mjs'
import { toDisplay, toStored } from '../site/units.mjs'

// Every size on the site is decimal: 1 MB is 1,000,000 bytes and 1 KB is
// 1,000. Measurements arrive in bytes, except the checker files, which store
// binary megabytes (2^20 bytes) and are converted with MIB_TO_MB.
//
// What is written holds every time in milliseconds and every memory figure in
// bytes, whatever the task. A figure is first rounded in the unit it is shown
// in (µs or ms, MB, KB), as it always was, and that rounded figure is what is
// stored (`held`), so a page shows exactly the number that was graded.
// Classes are worked out on the shown figures (`shown`) for the same reason.
const MB = 1e6
const KB = 1e3
const MIB_TO_MB = 2 ** 20 / MB

// Default class boundaries, as multiples of the task's best result: A is
// within 1.5x of the best, G is more than 50x. A metric whose entries sit
// closer together sets its own, tighter `scale` in task.json, the way each
// appliance group has its own label thresholds. Boundaries closer than about
// 1.25x apart are below the current run-to-run noise.
const DEFAULT_RATIO_SCALE = [1.5, 3, 6, 12, 25, 50]
// Memory results sit closer together than CPU results (on the default scale
// almost nothing reached F or G), so memory has a tighter scale of its own:
// about 1.6x a class instead of 2x, and G is more than 16x the best.
const MEMORY_RATIO_SCALE = [1.5, 2.5, 4, 6.5, 10, 16]
// Type-check memory applies to every package, not to a task, so it uses
// absolute boundaries in MB. Provisional: set from a small sample.
// Type-check cost is the time added times the memory added, in MB·s: CPU
// seconds × MB, the unit serverless platforms bill in. Being the product of a
// time and a memory figure, its class boundaries are the products of theirs:
// each class's CPU boundary times its memory boundary. Like CPU and memory it
// is graded as a multiple of the best entry in the task, separately for each
// compiler. Time below `timeFloorMs` is run-to-run noise and counts as the
// floor. So does memory below TYPE_MEMORY_FLOOR_MB: most checkers are measured
// by the peak memory of their process, and the runs of one empty baseline
// differ by 0.3 to 0.6 MB (mypy, rbs), so a median of them resolves about a
// quarter of a megabyte. The lowest cost there can be is the product of the
// two, 0.0025 MB·s. The Go checker's peak memory depends on when its garbage
// collector runs: the runs of one module differ by 8 MB (median), and a third
// of the modules measure below the reference, so its floor is higher.
const TYPE_MEMORY_FLOOR_MB = 0.25
const GO_MEMORY_FLOOR_MB = 5
const TYPE_RATIO_SCALE = DEFAULT_RATIO_SCALE.map((times, i) => times * MEMORY_RATIO_SCALE[i])
const TYPES_METRIC = {
  displayUnit: 'MB·s',
  headline: 'MB·s of type-check cost (CPU seconds × MB)',
  absolute: false,
  scale: TYPE_RATIO_SCALE,
  floor: 0.0025,
  timeFloorMs: { tsc: 10, tsgo: 10 },
}
// Rust type checking is a different tool with different costs, so crates are
// graded only against each other: multiples of the best crate in the task.
const CARGO_CHECK_METRIC = { displayUnit: 'MB·s', headline: 'MB·s of cargo check cost (CPU seconds × MB)', scale: TYPE_RATIO_SCALE, absolute: false, floor: 0.0025 }
// The compiler the type-check class is based on.
const TYPES_COMPILER = 'tsgo'
// Retained heap growing faster than this per request is flagged as a leak.
const LEAK_BYTES_PER_REQUEST = 8

const CLASSES = 'ABCDEFG'
const classFor = (value, scale) => CLASSES[scale.findIndex((limit) => value <= limit)] ?? 'G'
const round = (n, digits = 1) => (n === null || n === undefined ? null : Number(n.toFixed(digits)))
// A figure rounded in the unit it is shown in, as it is stored. The way back
// must give the same figure again, or a page would show another number.
function held(figure, unit) {
  if (figure === null || figure === undefined) return null
  const stored = toStored(figure, unit)
  if (toDisplay(stored, unit) !== figure) throw new Error(`${figure} ${unit} does not survive being stored as ${stored}`)
  return stored
}
const shown = toDisplay
const stripAnsi = (text) => text?.replace(/\u001b\[[\d;]*m/g, '') ?? null

// One number per measurement: the median across rounds, then across runs.
function summarize(result, baseline, kind) {
  const perRun = (fn) => median(result.runs.map(fn))
  const perRound = (fn) => perRun((run) => median(run.rounds.map(fn)))
  const baseHeap = median(baseline.runs.map(r => r.heapUsedBytes))
  // Memory is the physical footprint where both the result and its baseline
  // have it (see `footprintBytes` in the supervisor); older results have only
  // the resident size.
  const footprint = result.runs.every((r) => r.footprintAfterLoadBytes != null) && baseline.runs.every((r) => r.footprintBytes != null)
  const memoryHeld = (r) => (footprint ? r.footprintAfterLoadBytes : r.rssAfterLoadBytes)
  const baseRss = median(baseline.runs.map((r) => (footprint ? r.footprintBytes : r.rssBytes)))

  const operations = result.runs[0].rounds[0].operations !== undefined
  const count = (r) => r.operations ?? r.requests
  const cpuPerRequestUs = perRound((r) => (r.cpuMs * 1000) / count(r))
  const leak = perRun((run) => {
    const first = run.rounds[0]
    const last = run.rounds.at(-1)
    return first.heapUsedBytes == null || last.heapUsedBytes == null ? null : (last.heapUsedBytes - first.heapUsedBytes) / (run.rounds.slice(1).reduce((n, r) => n + count(r), 0) || Infinity)
  })
  const heapPeak = perRun((r) => r.heap.peakBytes)

  const startup = kind === 'server-startup'
  return {
    metrics: {
      // CPU time for one unit of work: an operation, a request, or, in a
      // startup task (whose round is one launch), a start.
      cpuMs: startup ? round(perRound((r) => r.cpuMs), 1) : held(round(cpuPerRequestUs, operations ? 4 : 1), 'µs'),
      // A startup task's time to the first page.
      ...(startup ? { startupMs: round(perRound((r) => r.wallMs), 1) } : {}),
      perCpuSecond: Math.round(1e6 / cpuPerRequestUs),
      memoryBytes: held(round(Math.max(0, (perRun(memoryHeld) - baseRss) / MB)), 'MB'),
      memoryAboveBaselineBytes: held(round((perRun(memoryHeld) - baseRss) / MB), 'MB'),
      totalMemoryBytes: held(round(perRun(memoryHeld) / MB), 'MB'),
      memoryKind: footprint ? 'footprint' : 'rss',
      peakMemoryBytes: held(round(perRun((r) => r.peakRssBytes) / MB), 'MB'),
      heapPeakBytes: held(round(heapPeak === null ? null : heapPeak / MB, 2), 'MB'),
      heapRetainedBytes: held(round(perRun((r) => r.rounds.at(-1).heapUsedBytes == null || r.heap.readyBytes == null ? null : (r.rounds.at(-1).heapUsedBytes - r.heap.readyBytes) / KB), 0), 'KB'),
      heapAboveBaselineBytes: baseHeap === null ? null : held(round(perRun(r => r.rounds.at(-1).heapUsedBytes == null ? null : (r.rounds.at(-1).heapUsedBytes - baseHeap) / KB), 1), 'KB'),
      // Heap growth from the first round to the last, for one unit of work.
      leakBytesPerUnit: round(leak, 2),
      importMs: round(perRun((r) => r.importMs)),
      // Size on disk once installed (or added to a Rust binary); see scripts/lib/install-size.mjs.
      installBytes: result.install?.bytes ?? null,
      installPackages: result.install?.packages ?? null,
      installKind: result.install?.kind ?? null,
      throughputPerSecond: Math.round(perRound((r) => (count(r) * 1000) / r.wallMs)),
      latencyP50Ms: round(perRound((r) => r.latencyP50Ms), 2),
      latencyP99Ms: round(perRound((r) => r.latencyP99Ms), 2),
    },
    flags: leak > LEAK_BYTES_PER_REQUEST ? ['grows-with-use'] : [],
  }
}

// A type check as it is stored: its memory in bytes, its cost named with its
// unit, and the time of a first cargo check in milliseconds like every other
// time. The checkers below work in megabytes, the unit the cost is made of.
function storedCheck(check) {
  if (!check) return check
  const { memoryMb, value, score, coldCpuS, compilers, adapter, ...rest } = check
  return {
    ...rest,
    ...(compilers ? { compilers: Object.fromEntries(Object.entries(compilers).map(([id, compiler]) => [id, storedCheck(compiler)])) } : {}),
    ...(adapter !== undefined ? { adapter: storedCheck(adapter) } : {}),
    ...(memoryMb !== undefined ? { memoryBytes: held(memoryMb, 'MB') } : {}),
    ...(coldCpuS !== undefined ? { coldCpuMs: held(coldCpuS, 's') } : {}),
    ...(value !== undefined || score !== undefined ? { costMbS: value ?? score ?? null } : {}),
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
// Type-check costs of whole packages, measured without an adapter by the
// sweeps in scripts/sweep-types/: what loading a package's types adds to a
// check. Where a package has one, it is the figure its class is set from, so
// that a measured package and a listed one are compared by the same method.
const SWEPT = { pypi: 'python', rubygems: 'ruby', cargo: 'cargo', gomod: 'go' }
// What each sweep subtracts from the check of a program that only loads the
// package. Go has no prebuilt standard library to check against, so its sweep
// subtracts the standard library packages the module uses.
const SWEPT_BASIS = {
  rubygems: 'A program that only loads the gem\'s signatures is checked, and the same check of the standard library signatures it uses is subtracted.',
  cargo: 'A program that only depends on the crate is checked from nothing, the crate and its whole dependency tree, and the same check of an empty program is subtracted, with the time cargo and rustc take to start once for every crate in the tree.',
  gomod: 'A program that only imports the module is checked from source, and the same check of a program that imports only the standard library packages it uses is subtracted.',
}
const SWEPT_BASIS_DEFAULT = 'A program that only loads the package is checked, and the same check of an empty program is subtracted.'
// What a result says of its own install, added to the entry's account of how
// it is set up: compiled code that came prebuilt, and gems compiled on the
// machine (the one case where a package's code runs at install; see
// scripts/lib/native-packages.mjs).
const listOf = (names) => names.join(', ')
function installNote(result) {
  const { prebuilt, built } = result.install ?? {}
  if (!prebuilt?.length && !built?.length) return null
  const registry = { pypi: 'PyPI', rubygems: 'RubyGems' }[result.ecosystem] ?? result.ecosystem
  return [
    `Installed from ${registry} at a release at least seven days old, each file checked by its SHA-256.`,
    prebuilt?.length ? `${listOf(prebuilt)}: compiled code that its authors built and published for this platform (a ${result.ecosystem === 'pypi' ? 'binary wheel' : 'precompiled gem'}); nothing was compiled or run to install it.` : null,
    built?.length ? `${listOf(built)}: has a native extension, compiled on this machine when the gem was installed (its extconf.rb runs).` : null,
  ].filter(Boolean).join(' ')
}
const sweeps = {}
for (const id of Object.keys(SWEPT)) sweeps[id] = await readJson(fromRoot('data', id, 'types.json'), null)
// Cargo starts one rustc for every crate of a tree. What one start costs
// (scripts/sweep-types/cargo-startup.mjs) is taken off once per compiled crate,
// so that a tree of many small crates is not graded by its compiler starts.
const cargoStartup = await readJson(fromRoot('data/cargo/startup.json'), null)
const startCpuMs = (ecosystemId, found) => (ecosystemId === 'cargo' && cargoStartup ? cargoStartup.perCrateCpuMs * (found.compiledCrates ?? 0) : 0)
function sweptCheck(ecosystemId, name) {
  const file = sweeps[ecosystemId], found = file?.packages?.[name]
  if (found?.status !== 'ok' || !found.added) return null
  // The sweeps store binary megabytes, like the other checker files.
  const cpuMs = round(Math.max(0, found.added.cpuMs - startCpuMs(ecosystemId, found)), 1), memoryMb = round(Math.max(0, found.added.memoryMb) * MIB_TO_MB, 2)
  return { tool: [file.checker?.tool, file.checker?.version].filter(Boolean).join(' '), version: found.version ?? null, from: found.typesFrom ?? null, community: !!found.communityTypes, cpuMs, memoryMb, value: round((Math.max(memoryMb, ecosystemId === 'gomod' ? GO_MEMORY_FLOOR_MB : TYPE_MEMORY_FLOOR_MB) * Math.max(cpuMs, 10)) / 1000, 5) }
}

function typeCheck(typesPackage, version) {
  const current = types.packages[typesPackage]
  const typed = !version || current?.version === version ? current : types.versions?.[typesPackage]?.[version]
  if (typed?.status !== 'ok') return null
  // Types that the package's authors did not publish, such as @types/* packages.
  const community = typed.communityTypes ?? (typed.typesFrom && typed.typesFrom !== 'self') ? true : false
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
    const score = typed[id].cpuMs === undefined ? null : round((Math.max(memoryMb, TYPE_MEMORY_FLOOR_MB) * Math.max(cpuMs, TYPES_METRIC.timeFloorMs[id] ?? 10)) / 1000, 5)
    compilers[id] = { timeMs, cpuMs, memoryMb, score, symbols: typed[id].symbols, files: typed[id].files, ...(community ? { community } : {}) }
  }
  return {
    package: typesPackage,
    ...(community ? { community } : {}),
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
  return { tool: 'cargo', value: checked.warmCpuMs === undefined ? null : round((Math.max(checked.addedMb, TYPE_MEMORY_FLOOR_MB) * Math.max(cpuMs, 10)) / 1000, 5), timeMs, cpuMs, memoryMb: checked.addedMb, coldCpuS: checked.coldCpuS }
}

// dist/ is updated in place: the site build writes only the files that
// changed and then removes the ones it no longer produces, so nothing stale
// is deployed and a page being viewed never disappears mid-build.
await mkdir(fromRoot('dist'), { recursive: true })

const generatedAt = new Date().toISOString()
const index = { edition: config.edition, generatedAt, compilers: types.compilers, categories: [], tasks: [], planned: [] }

const unmeasured = []
const pending = []
const categoryFiles = new Map()
for (const taskFile of globSync('benchmarks/*/*/task.json', { cwd: fromRoot() }).sort()) {
  const task = await readJson(fromRoot(taskFile))
  const taskId = `${task.category}/${task.task}`
  const taskDir = fromRoot(path.dirname(taskFile))
  // A task can run the adapters of another task (task.json `adaptersFrom`, as
  // a lenient task does with those of its strict task): the adapter's record
  // and its type check are that task's, the results are this one's.
  const adaptersTask = task.adaptersFrom ?? taskId
  const adaptersDir = fromRoot('benchmarks', adaptersTask)
  const runtimes = {}
  let machine = null

  // A task with nothing measured yet (a benchmark still being written) has
  // no figures to grade, so it stays out of the site until its first results.
  const resultFiles = globSync('**/*.json', { cwd: fromRoot('results', taskId) })
  if (!resultFiles.length) { unmeasured.push(taskId); continue }

  for (const file of resultFiles) {
    const result = await readJson(fromRoot('results', taskId, file))
    const baseline = result.baseline ?? await readJson(fromRoot('results/_baseline', `${result.runtime}.json`))
    const sharedAdapter = await readJson(path.join(adaptersDir, result.ecosystem, result.package, 'adapter.json'))
    const adapter = {...sharedAdapter,...sharedAdapter.versions?.[result.version]}
    machine ??= result.machine

    const runtime = (runtimes[result.runtime] ??= {
      id: result.runtime,
      title: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).title,
      version: result.runtimeVersion,
      language: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).language ?? (result.runtime === 'rust' ? 'rust' : 'javascript'),
      // False for a language without a garbage collector: its labels do not speak of one.
      garbageCollected: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).garbageCollected ?? true,
      heapDescription: (config.runtimes[result.runtime] ?? config.toolchains[result.runtime]).heapDescription ?? 'Runtime-reported heap plus external allocations (Rust: counted live allocations).',
      baselineHeapBytes: held(round(median(baseline.runs.map(r => r.heapUsedBytes)) === null ? null : median(baseline.runs.map(r => r.heapUsedBytes)) / KB), 'KB'),
      baselineBytes: held(round(median(baseline.runs.map((r) => r.rssBytes)) / MB), 'MB'),
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
      runtime.unsupported.push({ id, package:adapter.package ?? result.package, ecosystem:result.ecosystem, version:result.version, title:adapter.title ?? result.package, status:result.status, notes:adapter.runtimeNotes?.[result.runtime] ?? (result.status === 'unsupported' ? result.error : null), error:stripAnsi(result.error)?.replaceAll(fromRoot(), '[workspace]') })
      continue
    }

    // In the lenient task of a pair, an entry that does not pass the strict
    // task on this runtime says so before its note, which holds the reason.
    const strictResult = task.strictness === 'lenient' && task.pairedWith ? await readJson(fromRoot('results', task.pairedWith, result.ecosystem, result.package, result.version ?? '_', `${result.runtime}.json`), null) : null
    const failsStrict = Boolean(strictResult?.status) && strictResult.status !== 'ok' && strictResult.status !== 'unsupported'
    const checked = rustCheck.crates[`${adaptersTask}/cargo/${result.package}`]
    // data/native-checks.json holds binary megabytes.
    const storedNative = nativeChecks.adapters[`${adaptersTask}/${result.ecosystem}/${result.package}`]
    const native = storedNative && { ...storedNative, memoryMb: storedNative.memoryMb * MIB_TO_MB }
    const nativeInfo = native && {
      tool: native.tool, metricKey: native.language, language: native.language,
      icon: { python: 'cpython', ruby: 'ruby', go: 'go' }[native.language],
      version: native.version, notes: nativeChecks.checkers[native.language].notes,
      cpuMs: round(native.cpuMs, 2), timeMs: round(native.timeMs, 2), memoryMb: round(native.memoryMb, 3),
      value: round((Math.max(native.memoryMb, TYPE_MEMORY_FLOOR_MB) * Math.max(native.cpuMs, 10)) / 1000, 5),
    }
    const typeInfo =
      nativeInfo ? nativeInfo
        : result.ecosystem !== 'cargo'
        ? typeCheck(adapter.types ?? adapter.package ?? result.package, adapter.types ? null : result.version)
        : checked && cargoCheck(checked)
    // A swept figure for the whole package replaces the adapter's as the one
    // that is graded; the adapter's stays beside it.
    const swept = result.ecosystem in SWEPT && !result.builtin ? sweptCheck(result.ecosystem, result.ecosystem === 'gomod' ? adapter.module : adapter.package ?? result.package) : null
    const gradedTypes = swept
      ? { ...(typeInfo || {}), tool: swept.tool, swept: true, basis: SWEPT_BASIS[result.ecosystem] ?? SWEPT_BASIS_DEFAULT, metricKey: SWEPT[result.ecosystem] === 'cargo' ? undefined : SWEPT[result.ecosystem], icon: typeInfo?.icon ?? { python: 'cpython', ruby: 'ruby', go: 'go' }[SWEPT[result.ecosystem]], adapter: typeInfo ? { cpuMs: typeInfo.cpuMs, memoryMb: typeInfo.memoryMb, value: typeInfo.value } : null, cpuMs: swept.cpuMs, memoryMb: swept.memoryMb, value: swept.value, ...(swept.community ? { community: true, from: swept.from } : {}) }
      : typeInfo
    ;(isCurrent ? runtime.entries : runtime.history).push({
      id,
      ecosystem: result.ecosystem,
      name: result.package,
      // Variants of one package (for example a non-default configuration)
      // are separate adapters that share a `package`.
      // A Go module is one package whatever its adapter's folder is called: the
      // name made from its module path (the first entries had short names).
      package: result.ecosystem === 'gomod' && adapter.module ? goPackageName(adapter.module) : adapter.package ?? result.package,
      // A Go module's path (adapter.json `module`): what it is listed and linked by.
      ...(adapter.module ? { module: adapter.module } : {}),
      title: adapter.title ?? result.package,
      version: result.version ?? null,
      defaultVersion: release.primary,
      activeRelease: release.active,
      builtin: result.ecosystem === 'builtin',
      // An entry kept for reference (adapter.json `reference`), such as a server
      // with no framework among frameworks: it sets no class and gets none.
      ...(adapter.reference ? { reference: true } : {}),
      ...summarize(result, baseline, task.kind),
      grades: {},
      measurement: { runs: result.runs.length, roundsPerRun: result.runs.map((r) => r.rounds.length), warmupRoundsPerRun: result.runs.map(r => r.warmupRounds?.length ?? 0), harness: result.harness },
      adapter: {
        author: adapter.author,
        review: adapter.review,
        reviewed: adapter.reviewed ?? null,
        tags: adapter.tags ?? [],
        ...(failsStrict ? { strict: { task: task.pairedWith, passes: false } } : {}),
        notes: [failsStrict ? `Does not pass the strict task${adapter.notes ? ':' : '.'}` : null, adapter.notes, result.harness < 2 ? 'Historical measurement: predates the full same-process warm-up; not directly comparable with current measurements.' : null].filter(Boolean).join(' ') || null,
        runtimeNotes: adapter.runtimeNotes ?? {},
        // The long account of how the entry is set up; `notes` is the short one on the label.
        ...(adapter.details || installNote(result) ? { details: [adapter.details, installNote(result)].filter(Boolean).join(' ') } : {}),
        dependencies: Object.entries(result.dependencies ?? {})
          .filter(([name]) => name !== result.package)
          .map(([name, version]) => `${name}@${version}`),
      },
      types: storedCheck(gradedTypes),
    })
  }

  // Class A is set by the best result for the task in any language or
  // runtime, so a class means the same thing everywhere it appears.
  const metrics = {}
  for (const [metricId, spec] of Object.entries(task.metrics)) {
    // task.json gives the floor as it is stored, in ms or bytes.
    const floor = spec.floor ?? 0
    const scale = spec.scale ?? (metricId === 'memory' ? MEMORY_RATIO_SCALE : DEFAULT_RATIO_SCALE)
    // The figure as shown, which is what a class compares.
    const value = (entry) => Math.max(shown(entry.metrics[spec.key], spec.displayUnit), shown(floor, spec.displayUnit))
    const all = Object.values(runtimes).flatMap((runtime) => runtime.entries.map((entry) => ({ entry, runtime })))
    if (all.length === 0) continue
    // Reference entries do not set class A, unless there is nothing else.
    const graded = all.filter((a) => !a.entry.reference)
    const best = (graded.length ? graded : all).reduce((a, b) => (value(a.entry) <= value(b.entry) ? a : b))
    const others = Object.values(runtimes).flatMap((runtime) => runtime.history)
    for (const entry of [...all.map((a) => a.entry), ...others]) {
      const ratio = value(entry) / value(best.entry)
      entry.grades[metricId] = entry.reference
        ? { class: null, reference: true, ratio: round(ratio, 2), value: entry.metrics[spec.key] }
        : { class: classFor(ratio, scale), ratio: round(ratio, 2), value: entry.metrics[spec.key] }
    }
    // What an entry costs over the best reference entry on the same runtime.
    for (const runtime of Object.values(runtimes)) {
      const references = runtime.entries.filter((e) => e.reference)
      if (!references.length) continue
      const base = references.reduce((a, b) => (value(a) <= value(b) ? a : b))
      for (const entry of runtime.entries) {
        if (!entry.reference) entry.grades[metricId].overhead = { ratio: round(value(entry) / value(base), 2), title: base.title }
      }
    }
    metrics[metricId] = {
      displayUnit: spec.displayUnit,
      headline: spec.headline,
      scale,
      floor,
      anchor: { id: best.entry.id, title: best.entry.title, version: best.entry.version, runtime: best.runtime.title, value: Math.max(best.entry.metrics[spec.key], floor) },
    }
  }
  // Runtime comparisons include the runtime itself; package comparisons
  // describe incremental cost over that runtime's empty process.
  // Reference entries do not set the best here either, unless there is nothing else.
  const everyMemoryEntry = Object.values(runtimes).flatMap(runtime => runtime.entries)
  const totalMemoryEntries = everyMemoryEntry.some(entry => !entry.reference) ? everyMemoryEntry.filter(entry => !entry.reference) : everyMemoryEntry
  const totalMemoryBest = Math.min(...totalMemoryEntries.map(entry => entry.metrics.totalMemoryBytes))
  for (const runtime of Object.values(runtimes)) {
    for (const entry of [...runtime.entries, ...runtime.history]) {
      const ratio = shown(entry.metrics.totalMemoryBytes, 'MB') / shown(totalMemoryBest, 'MB')
      entry.runtimeGrades = { memory: { class: classFor(ratio, metrics.memory.scale), ratio: round(ratio, 2), value: entry.metrics.totalMemoryBytes } }
    }
  }
  const runtimeMetrics = { memory: { ...metrics.memory, headline: 'MB after task and GC', floor: 0, anchor: { value: totalMemoryBest } } }
  // Type-check costs share a unit whichever checker produced them. Their
  // classes are set after the loop, over the task's whole category.
  const everyEntry = Object.values(runtimes).flatMap((runtime) => runtime.entries)
  const everyVersion = [...everyEntry, ...Object.values(runtimes).flatMap((runtime) => runtime.history)]
  const scored = everyEntry.filter((e) => e.types?.costMbS != null)
  const typeChecks = { typescript: { ...TYPES_METRIC, tool: `TypeScript ${types.compilers[TYPES_COMPILER]}` } }
  if (rustCheck.rust) typeChecks.cargo = { ...CARGO_CHECK_METRIC, tool: `cargo check, Rust ${rustCheck.rust}` }
  for (const [language, checker] of Object.entries(nativeChecks.checkers)) {
    if (everyEntry.some((e) => e.types?.metricKey === language)) typeChecks[language] = { ...TYPES_METRIC, tool: `${checker.tool} ${checker.version}`, notes: checker.notes }
  }
  // Where a language's entries are graded by a swept figure, the tool named is the sweep's.
  for (const [ecosystemId, language] of Object.entries(SWEPT)) {
    const sample = everyEntry.find((e) => e.types?.swept && e.ecosystem === ecosystemId)
    if (sample) typeChecks[language] = { ...(language === 'cargo' ? CARGO_CHECK_METRIC : TYPES_METRIC), ...typeChecks[language], tool: sample.types.tool, notes: sample.types.basis }
  }
  const order = [...Object.keys(config.runtimes), ...Object.keys(config.toolchains)]
  const data = {
    edition: config.edition,
    generatedAt,
    machine,
    // The other task of a strict and lenient pair is named only once it has results, and so a page.
    task: { id: taskId, ...task, cpuPer: task.kind === 'server-startup' ? 'start' : task.kind === 'sync-operation' || task.kind === 'async-operation' ? 'operation' : 'request', ...(task.pairedWith && !globSync('**/*.json', { cwd: fromRoot('results', task.pairedWith) }).length ? { pairedWith: undefined } : {}) },
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
  // Type-check classes are set over the whole category, once every task of it
  // has been read; the task's file is written then.
  if (!categoryFiles.has(task.category)) categoryFiles.set(task.category, await readJson(fromRoot('benchmarks', task.category, 'category.json')))
  pending.push({ taskId, data, taxonomy: categoryFiles.get(task.category).taxonomy ?? task.category, scored, everyVersion, typeChecks })

  if (!index.categories.some((c) => c.id === task.category)) {
    index.categories.push({ id: task.category, ...categoryFiles.get(task.category) })
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

// Type-check classes. A type-check cost does not depend on a task: it is what
// a package's types (or, for the other checkers, its adapter) add to a check.
// So its class compares a package with the lowest-cost package of its
// category, in any language and whichever checker produced the figure:
// every measured entry of the category's tasks, and every listed package of
// the category that has a type-check measurement. A built-in adds nothing to
// a check (its runtime's types are already loaded) and does not set class A;
// built-ins are still graded, and come out as A. Categories with no
// comparable task have no class.
const typeValue = (score) => Math.max(score, TYPES_METRIC.floor)
const comparable = new Set(taxonomy.categories.filter((c) => c.benchmarkable).map((c) => c.id))
const lowest = new Map()
// How many different packages of a category have a figure: one alone has
// nothing to be compared with, and gets no class.
const typedIn = new Map()
const offer = (category, candidate) => {
  if (!comparable.has(category) || candidate.value == null) return
  if (!typedIn.has(category)) typedIn.set(category, new Set())
  typedIn.get(category).add(candidate.key ?? candidate.title)
  const held = lowest.get(category)
  if (!held || typeValue(candidate.value) < typeValue(held.value)) lowest.set(category, candidate)
}
for (const id of ['npm', 'jsr']) {
  for (const [name, a] of Object.entries(await readJson(fromRoot(ecosystem(id).categories), {}))) {
    const typed = typeCheck(a.name ?? name, null)
    if (typed) offer(a.category, { title: a.name ?? name, version: types.packages[a.name ?? name]?.version ?? null, tool: `TypeScript ${types.compilers[TYPES_COMPILER]}`, value: typed.value })
  }
}
for (const id of Object.keys(SWEPT)) {
  for (const [name, a] of Object.entries(await readJson(fromRoot(ecosystem(id).categories), {}))) {
    const swept = sweptCheck(id, a.name ?? name)
    if (swept) offer(a.category, { title: a.name ?? name, version: swept.version, tool: swept.tool, value: swept.value })
  }
}
for (const { taxonomy: category, scored, typeChecks } of pending) {
  for (const e of scored.filter((e) => !e.builtin)) offer(category, { key: e.package ?? e.name ?? e.title, title: e.title, version: e.version, tool: typeChecks[e.types.metricKey ?? (e.ecosystem === 'cargo' ? 'cargo' : 'typescript')]?.tool, value: e.types.costMbS })
}
index.typeAnchors = {}
for (const { taskId, data, taxonomy: category, scored, everyVersion, typeChecks } of pending) {
  // A category of built-ins alone is graded against the lowest of them.
  const alone = (typedIn.get(category)?.size ?? 0) === 1
  const best = alone ? null : lowest.get(category) ?? (scored.length ? scored.map((e) => ({ title: e.title, version: e.version, tool: null, value: e.types.costMbS })).reduce((a, b) => (typeValue(a.value) <= typeValue(b.value) ? a : b)) : null)
  if (best) {
    const bestValue = typeValue(best.value)
    const grade = (score) => {
      const ratio = Math.max(1, typeValue(score) / bestValue)
      return { class: classFor(ratio, TYPES_METRIC.scale), ratio: round(ratio, 2) }
    }
    for (const e of everyVersion) {
      if (e.types?.costMbS != null) e.grades.types = { ...grade(e.types.costMbS), value: e.types.costMbS }
      // Each TypeScript compiler's own figure is graded on the same scale.
      for (const compiler of Object.values(e.types?.compilers ?? {})) {
        if (compiler?.costMbS != null) Object.assign(compiler, grade(compiler.costMbS))
      }
    }
    const anchor = { title: best.title, version: best.version, tool: best.tool, value: bestValue, category: taxonomy.categories.find((c) => c.id === category)?.title ?? category }
    for (const check of Object.values(typeChecks)) check.anchor = anchor
  }
  await writeJson(fromRoot('dist/data', `${taskId}.json`), data)
}
// For the listed packages that are not measured: the same anchors, by category.
for (const [category, best] of lowest) if (typedIn.get(category).size > 1) index.typeAnchors[category] = { title: best.title, version: best.version, tool: best.tool, value: typeValue(best.value) }
index.typeScale = TYPES_METRIC.scale
index.typeFloor = TYPES_METRIC.floor

await writeJson(fromRoot('dist/data/index.json'), index)
if (unmeasured.length) console.log(`not measured yet, left out: ${unmeasured.join(', ')}`)
