// Shared pieces of the type-check sweeps of PyPI, RubyGems and crates.io
// (scripts/sweep-types/<registry>.mjs): the release-age cutoff, timing, the
// list of packages to measure and the resumable loop. Each sweep writes
// data/<registry>/types.json; scratch files live under .cache/sweep-types/.
import { execFile } from 'node:child_process'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

export const exec = promisify(execFile)
export const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const fromRoot = (...parts) => path.join(ROOT, ...parts)
export const MIN_RELEASE_AGE_DAYS = 7
export const DAY_MS = 86_400_000
// One cutoff for the whole run, so a release cannot become eligible half way.
export const CUTOFF = Date.now() - MIN_RELEASE_AGE_DAYS * DAY_MS
export const oldEnough = (iso) => Number.isFinite(Date.parse(iso)) && Date.parse(iso) <= CUTOFF

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback
    throw err
  }
}

// Written to a temporary file and renamed, so a kill during a save cannot
// leave half a results file.
export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file + '.tmp', JSON.stringify(value, null, 2) + '\n')
  await rename(file + '.tmp', file)
}

export function median(values) {
  const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}
export const round = (n, digits = 1) => (Number.isFinite(n) ? Number(n.toFixed(digits)) : null)
export const spread = (values) => round(Math.max(...values) - Math.min(...values), 1)

// harness/checkers/time.py: wait4 on the child, so CPU (user + system, all
// threads, reaped descendants included) to the microsecond and peak RSS of the
// largest process in the tree.
const TIMER = ['/opt/homebrew/bin/python3', fromRoot('harness/checkers/time.py')]
export async function timed(argv, options = {}) {
  const { stdout } = await exec(TIMER[0], [TIMER[1], ...argv], { maxBuffer: 256 << 20, ...options })
  return JSON.parse(stdout)
}

// N fresh processes; medians, with the raw runs kept.
export async function measure(argv, options, runs) {
  const all = []
  for (let i = 0; i < runs; i++) {
    const r = await timed(argv, options)
    all.push({ status: r.status, cpuMs: round(r.cpuMs, 2), timeMs: round(r.timeMs, 2), peakRssMb: round(r.peakRssMb, 2) })
  }
  return {
    cpuMs: median(all.map((r) => r.cpuMs)),
    timeMs: median(all.map((r) => r.timeMs)),
    peakRssMb: median(all.map((r) => r.peakRssMb)),
    runs: all,
  }
}

// What a sweep measures: the names given, or with --top=N the N most used of
// data/<registry>/packages.json plus everything in data/<registry>/picked.json
// (packages added by hand, outside the most used; the file may be absent).
export async function loadTargets(registry, names, top) {
  const listed = await readJson(fromRoot('data', registry, 'packages.json'), [])
  const picked = await readJson(fromRoot('data', registry, 'picked.json'), [])
  const listedVersion = Object.fromEntries([...picked, ...listed].map((p) => [p.name, p.version]))
  const chosen = top ? [...listed.slice(0, top), ...picked].map((p) => p.name) : names
  return { targets: [...new Set(chosen)].map((name) => ({ name })), listedVersion }
}

export function args(usage) {
  const argv = process.argv.slice(2)
  const flags = argv.filter((a) => a.startsWith('--'))
  const names = argv.filter((a) => !a.startsWith('--'))
  const value = (name, fallback) => flags.find((f) => f.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
  const has = (name) => flags.includes(`--${name}`)
  if (names.length === 0 && !value('top')) {
    console.error(usage)
    process.exit(1)
  }
  return { names, value, has }
}

export async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'user-agent': 'npm-efficiency type-check sweep', ...headers } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json()
}

// The resumable loop every sweep shares: skip what has a result, save after
// every package, finish the package in hand on Ctrl-C.
export async function sweep({ out, header, targets, force, retryFailed, measureOne, summary, allowOkWithoutAdded = false }) {
  const previous = await readJson(out, null)
  // Results are comparable only under the same checker and method; a file made
  // under another is started again.
  const same = (key) => JSON.stringify(previous?.[key]) === JSON.stringify(header[key])
  const reusable = previous && same('checker') && same('method')
  if (previous && !reusable) console.error(`${path.relative(ROOT, out)} was made with another checker or method: measuring everything again`)
  const packages = reusable ? previous.packages : {}
  const queue = targets.filter((t) => force || !packages[t.name] || (retryFailed && packages[t.name].status !== 'ok'))
  const total = queue.length
  if (targets.length > total) console.error(`${targets.length - total} already measured, skipped`)
  let stopping = false
  process.on('SIGINT', () => {
    if (stopping) process.exit(130)
    stopping = true
    console.error('\nStopping after the package in hand. Run the same command again to carry on.')
  })
  const save = () => writeJson(out, { ...header, packages: Object.fromEntries(Object.entries(packages).sort(([a], [b]) => a.localeCompare(b))) })
  const started = Date.now()
  let done = 0
  for (let target; !stopping && (target = queue.shift()); ) {
    const t0 = Date.now()
    let result
    try {
      result = await measureOne(target)
    } catch (err) {
      result = { status: 'harness-error', detail: String(err.stderr || err.message).trim().split('\n').slice(-3).join(' | ').slice(0, 400) }
    }
    // The site reads `added` in every registry's file: the graded figure.
    if (!allowOkWithoutAdded && result.status === 'ok' && !(Number.isFinite(result.added?.cpuMs) && Number.isFinite(result.added?.memoryMb))) result = { status: 'harness-error', detail: 'an ok result without added.cpuMs and added.memoryMb' }
    result.load = Number(os.loadavg()[0].toFixed(2))
    result.measuredAt = new Date().toISOString()
    result.harnessSeconds = round((Date.now() - t0) / 1000, 1)
    packages[target.name] = result
    await save()
    const minutes = Math.round((((Date.now() - started) / ++done) * (total - done)) / 60_000)
    console.error(`[${done}/${total}] ${target.name}: ${summary(result)}  (${result.harnessSeconds}s${total > 20 ? `, ${minutes} min left` : ''})`)
  }
  await save()
  console.log(`wrote ${path.relative(ROOT, out)} (${Object.keys(packages).length} packages)${queue.length ? `, ${queue.length} still to do` : ''}`)
}

export async function duMb(dir) {
  try {
    const { stdout } = await exec('du', ['-sk', dir])
    return round(Number(stdout.split('\t')[0]) / 1024, 1)
  } catch {
    return null
  }
}
