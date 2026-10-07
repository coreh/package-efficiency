// Out-of-process half of the benchmark protocol. Launches one adapter as a
// child process (any runtime, any language), drives it through its phases and
// measures it from the outside, so every ecosystem is measured the same way.
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { runLoad } from './load.mjs'

export const HARNESS_VERSION = 6

const REPO_ROOT = new URL('..', import.meta.url).pathname
const PHASE_TIMEOUT_MS = 30_000
// A server that stops answering under load would otherwise hang the run forever.
const LOAD_TIMEOUT_MS = 300_000
// Sizing of operation runs: see measureOperation.
const PROBE_CALLS = 5
const WARMUP_LIMIT_MS = 2_000
const BATCHES_PER_ROUND = 10

function timedLoad(options) {
  let timer
  const expired = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`load of ${options.total} requests did not finish in ${LOAD_TIMEOUT_MS / 1000} s`)), LOAD_TIMEOUT_MS)
  })
  return Promise.race([runLoad(options), expired]).finally(() => clearTimeout(timer))
}
const TIME = process.platform === 'darwin' ? ['/usr/bin/time', '-l'] : ['/usr/bin/time', '-v']

// Total CPU seconds (user + system, all threads) the process has used so far.
function cpuSeconds(pid) {
  if (process.platform === 'linux') {
    const fields = readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')
    return (Number(fields[11]) + Number(fields[12])) / 100
  }
  // macOS prints [[hh:]mm:]ss.cc
  const parts = execFileSync('ps', ['-o', 'time=', '-p', String(pid)], { encoding: 'utf8' }).trim().split(':')
  return parts.reduce((total, part) => total * 60 + Number(part), 0)
}

const rssBytes = (pid) => Number(execFileSync('ps', ['-o', 'rss=', '-p', String(pid)], { encoding: 'utf8' })) * 1024

// The memory a process is charged with: what it has written to and still
// holds. Resident size is not that. It also counts the pages of the runtime's
// own binary, and on macOS pages the process has already handed back that the
// system has not yet taken (a runtime that frees eagerly then looks as if it
// held its high-water mark). macOS calls this the physical footprint, the
// figure Activity Monitor shows; on Linux it is the anonymous and shared-memory
// part of the resident size. null where neither can be read.
// A runtime hands freed pages back a moment after its collection returns
// (Bun read up to 9 MB high at once and settled within 100 ms), so memory is
// read after a short rest.
const MEMORY_REST_MS = 250
const rest = () => new Promise((resolve) => setTimeout(resolve, MEMORY_REST_MS))
function footprintBytes(pid) {
  try {
    if (process.platform === 'darwin') {
      const found = /phys_footprint: (\d+) B/.exec(execFileSync('/usr/bin/footprint', ['-f', 'bytes', '-p', String(pid)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
      return found ? Number(found[1]) : null
    }
    if (process.platform === 'linux') {
      const status = readFileSync(`/proc/${pid}/status`, 'utf8')
      const kb = (name) => Number(new RegExp(`^${name}:\\s+(\\d+) kB`, 'm').exec(status)?.[1] ?? NaN)
      const total = kb('RssAnon') + kb('RssShmem')
      return Number.isFinite(total) ? total * 1024 : null
    }
  } catch {}
  return null
}

// What the OS recorded for the whole life of the process.
function parseTimeReport(stderr) {
  const number = (pattern) => {
    const match = pattern.exec(stderr)
    return match ? Number(match[1]) : null
  }
  if (process.platform === 'darwin') {
    return {
      peakRssBytes: number(/(\d+)\s+maximum resident set size/),
      peakFootprintBytes: number(/(\d+)\s+peak memory footprint/),
    }
  }
  const kb = number(/Maximum resident set size \(kbytes\): (\d+)/)
  return { peakRssBytes: kb === null ? null : kb * 1024, peakFootprintBytes: null }
}

// `env` adds to the supervisor's own environment; variants use it for settings
// such as a thread count.
function launch(command, args, cwd, env) {
  // Own process group, so a hung adapter can be killed along with `time`.
  const child = spawn(TIME[0], [TIME[1], command, ...args], { cwd, env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'], detached: true })
  let stderr = ''
  child.stderr.on('data', (chunk) => (stderr += chunk))

  const queue = []
  let waiter = null
  let exited = false
  createInterface({ input: child.stdout }).on('line', (line) => {
    if (!line.startsWith('@@')) return
    const message = JSON.parse(line.slice(2))
    if (waiter) waiter.resolve(message)
    else queue.push(message)
  })
  const closed = new Promise((resolve) =>
    child.on('close', () => {
      exited = true
      waiter?.reject(new Error(lastLines(stderr)))
      resolve()
    }),
  )

  return {
    async expect(phase) {
      const message =
        queue.shift() ??
        (await new Promise((resolve, reject) => {
          if (exited) return reject(new Error(lastLines(stderr)))
          const timer = setTimeout(() => reject(new Error(`timed out waiting for "${phase}"`)), PHASE_TIMEOUT_MS)
          const settle = (fn) => (value) => {
            clearTimeout(timer)
            waiter = null
            fn(value)
          }
          waiter = { resolve: settle(resolve), reject: settle(reject) }
        }))
      if (message.phase !== phase) throw new Error(`expected phase "${phase}", got "${message.phase}": ${message.error ?? ""}`)
      return message
    },
    command(line) {
      child.stdin.write(line + '\n')
    },
    async finish() {
      if (!exited) child.stdin.end('exit\n')
      await closed
      return parseTimeReport(stderr)
    },
    async kill() {
      try {
        process.kill(-child.pid, 'SIGKILL')
      } catch {}
      await closed
    },
  }
}

// The adapter's own error, without the `time` report that follows it.
function lastLines(stderr) {
  const lines = stderr.split('\n').filter((l) => l.trim())
  const reportStart = lines.findIndex((l) => /^\s+[\d.]+ real\s/.test(l) || /Command (being timed|exited)/.test(l))
  const own = reportStart === -1 ? lines : lines.slice(0, reportStart)
  const headline = own.find(line => /(?:Error|Exception)(?:\s*\[.*?\])?:/.test(line))
  const message = [...new Set([...(headline ? [headline] : []), ...own.slice(-6)])].join('\n').trim() || 'exited before reporting'
  // Errors are stored with the results and published, so paths are kept
  // relative to the repository rather than to this machine.
  return message.replaceAll(REPO_ROOT, '')
}

// One full run of an empty process: what the runtime costs before any package.
export async function measureBaseline({ command, args, cwd, env }) {
  const child = launch(command, args, cwd, env)
  try {
    const boot = await child.expect('boot')
    const ready = await child.expect('ready')
    await rest()
    const rss = rssBytes(boot.pid), footprint = footprintBytes(boot.pid)
    const report = await child.finish()
    return { heapUsedBytes: ready.memory.heapUsed, rssBytes: rss, footprintBytes: footprint, ...report }
  } catch (error) {
    await child.kill()
    throw error
  }
}

// One full run of an HTTP server adapter under the scenario's request mix.
// Returns { status: 'ok', ... } or { status: 'failed' | 'verify-failed', error }.
export async function measureServer({ command, args, cwd, env, phases, requests, load }) {
  const child = launch(command, args, cwd, env)
  try {
    const boot = await child.expect('boot')
    const loaded = phases.includes('loaded') ? await child.expect('loaded') : null
    const ready = await child.expect('ready')
    const { pid } = boot
    const { port } = ready
    const client = { port, requests, workers: load.workers, connections: load.connections }

    // Every distinct request is checked in full before anything is measured.
    const verification = await timedLoad({ ...client, total: requests.length * 4, workers: 1, connections: 4, verify: true })
    if (verification.errors > 0) {
      await child.kill()
      return { status: 'verify-failed', error: verification.firstError }
    }

    await timedLoad({ ...client, total: load.warmup })
    child.command('settle')
    await child.expect('settled')
    // A full rehearsal in the SAME process preserves JIT compilation state.
    const warmupRounds = []
    for (let i = 0; i < load.rounds; i++) {
      const result = await timedLoad({ ...client, total: load.requestsPerRound })
      if (result.errors) throw new Error(`warm-up failed: ${result.firstError}`)
      warmupRounds.push({ requests: result.requests, wallMs: result.wallMs })
      child.command('settle')
      await child.expect('settled')
    }
    child.command('settle')
    const warm = await child.expect('settled')

    const rounds = []
    for (let i = 0; i < load.rounds; i++) {
      let cpuBefore
      const result = await timedLoad({ ...client, total: load.requestsPerRound, onStart: () => (cpuBefore = cpuSeconds(pid)) })
      const cpuMs = (cpuSeconds(pid) - cpuBefore) * 1000
      if (result.errors > 0) {
        await child.kill()
        return { status: 'failed', error: `${result.errors} failed requests under load: ${result.firstError}` }
      }
      child.command('settle')
      const settled = await child.expect('settled')
      rounds.push({
        requests: result.requests,
        cpuMs,
        wallMs: result.wallMs,
        latencyP50Ms: result.latencyP50Ms,
        latencyP99Ms: result.latencyP99Ms,
        heapUsedBytes: settled.memory.heapUsed,
      })
    }

    await rest()
    const rssAfterLoadBytes = rssBytes(pid), footprintAfterLoadBytes = footprintBytes(pid)
    // Only harnesses with an exact allocator count (Rust) report a heap peak.
    child.command('settle')
    const heapPeakBytes = (await child.expect('settled')).memory.heapPeak ?? null
    const report = await child.finish()
    return {
      status: 'ok',
      importMs: loaded?.importMs ?? null,
      importCpuMs: loaded?.importCpuMs ?? null,
      heap: {
        bootBytes: boot.memory.heapUsed,
        loadedBytes: loaded?.memory.heapUsed ?? null,
        readyBytes: ready.memory.heapUsed,
        warmBytes: warm.memory.heapUsed,
        peakBytes: heapPeakBytes,
      },
      rounds,
      warmupRounds,
      rssAfterLoadBytes, footprintAfterLoadBytes,
      ...report,
    }
  } catch (error) {
    await child.kill()
    return { status: 'failed', error: error.message }
  }
}

// How long a server takes to come up: a new process each time, from launch to
// its first verified response. A "round" here is one launch: its CPU time is
// all the process has used by then, its wall time runs from the launch. The
// shape of the result is that of measureServer, so the rest of the pipeline
// reads it the same way.
export async function measureStartup({ command, args, cwd, env, phases, requests, load }) {
  const rounds = []
  let last = null
  for (let i = 0; i < (load.launches ?? 5); i++) {
    const startedAt = performance.now()
    const child = launch(command, args, cwd, env)
    try {
      const boot = await child.expect('boot')
      const loaded = phases.includes('loaded') ? await child.expect('loaded') : null
      const ready = await child.expect('ready')
      const first = await timedLoad({ port: ready.port, requests: requests.slice(0, 1), total: 1, workers: 1, connections: 1, verify: true })
      const wallMs = performance.now() - startedAt
      const cpuMs = cpuSeconds(boot.pid) * 1000
      if (first.errors > 0) {
        await child.kill()
        return { status: 'verify-failed', error: first.firstError }
      }
      await rest()
      const rssAfterLoadBytes = rssBytes(boot.pid), footprintAfterLoadBytes = footprintBytes(boot.pid)
      child.command('settle')
      const settled = await child.expect('settled')
      const report = await child.finish()
      rounds.push({ requests: 1, cpuMs, wallMs, latencyP50Ms: null, latencyP99Ms: null, heapUsedBytes: settled.memory.heapUsed })
      last = { importMs: loaded?.importMs ?? null, importCpuMs: loaded?.importCpuMs ?? null, heap: { bootBytes: boot.memory.heapUsed, loadedBytes: loaded?.memory.heapUsed ?? null, readyBytes: ready.memory.heapUsed, warmBytes: settled.memory.heapUsed, peakBytes: null }, rssAfterLoadBytes, footprintAfterLoadBytes, ...report }
    } catch (error) {
      await child.kill()
      return { status: 'failed', error: error.message }
    }
  }
  return { status: 'ok', ...last, rounds, warmupRounds: [] }
}

// CPU comes from the child around the synchronous batch, at microsecond
// resolution. IPC, fixture creation, validation and settled GC are excluded.
export async function measureOperation({ command, args, cwd, env, load, verifyResults, phases = ['boot', 'loaded', 'ready'] }) {
  const child = launch(command, args, cwd, env)
  try {
    const boot = await child.expect('boot')
    const loaded = phases.includes('loaded') ? await child.expect('loaded') : null
    if (phases.includes('verification')) {
      const { outputs } = await child.expect('verification')
      try {
        if (typeof verifyResults !== 'function') throw new Error('scenario verifier is required')
        verifyResults(outputs)
      } catch (error) {
        await child.kill()
        return { status: 'verify-failed', error: error.message }
      }
      child.command('verified')
    }
    const ready = await child.expect('ready')
    // Every adapter gets the same time, whatever one call costs, so a run's
    // length is predictable: a warm-up of the task's call count or
    // WARMUP_LIMIT_MS, whichever comes first, then rounds of minRoundMs. A few
    // probe calls give the rough cost of a call; batches are sized from it so
    // that a round is about BATCHES_PER_ROUND batches (never more calls per
    // batch than the task's operationsPerRound), and the runner stops at the
    // first batch boundary past minRoundMs. Each round records how many calls
    // it made, and costs are per call.
    // The first calls of all pay for lazy start-up, so they are not the probe.
    child.command(JSON.stringify({ count: Math.min(PROBE_CALLS, load.warmup) }))
    await child.expect('round')
    child.command(JSON.stringify({ count: Math.min(PROBE_CALLS, load.warmup) }))
    const probe = await child.expect('round')
    const perCallMs = Math.max(probe.wallMs / probe.operations, 1e-6)
    const warmup = Math.min(load.warmup, Math.max(PROBE_CALLS, Math.floor(WARMUP_LIMIT_MS / perCallMs)))
    child.command(JSON.stringify({ count: warmup }))
    const warmed = await child.expect('round')
    const warmCallMs = Math.max(warmed.wallMs / warmed.operations, 1e-6)
    // A batch is a whole number of passes over the fixtures (load.cycle of
    // them), so every round of every adapter covers the same mix of inputs,
    // however fast the adapter is.
    const cycle = load.cycle ?? 1
    const batch = Math.ceil(Math.min(load.operationsPerRound, Math.max(1, Math.ceil(load.minRoundMs / BATCHES_PER_ROUND / warmCallMs))) / cycle) * cycle
    child.command('settle')
    await child.expect('settled')
    const warmupRounds = []
    for (let i = 0; i < load.rounds; i++) {
      child.command(JSON.stringify({ count: batch, minMs: load.minRoundMs }))
      const { phase, ...round } = await child.expect('round')
      warmupRounds.push(round)
      child.command('settle')
      await child.expect('settled')
    }
    child.command('settle')
    const warm = await child.expect('settled')
    const rounds = []
    for (let i = 0; i < load.rounds; i++) {
      child.command(JSON.stringify({ count: batch, minMs: load.minRoundMs }))
      const { phase, ...round } = await child.expect('round')
      child.command('settle')
      rounds.push({ ...round, heapUsedBytes: (await child.expect('settled')).memory.heapUsed })
    }
    await rest()
    const rssAfterLoadBytes = rssBytes(boot.pid), footprintAfterLoadBytes = footprintBytes(boot.pid)
    child.command('settle')
    const heapPeak = (await child.expect('settled')).memory.heapPeak ?? null
    const report = await child.finish()
    return { status: 'ok', importMs: loaded?.importMs ?? null, importCpuMs: loaded?.importCpuMs ?? null,
      heap: { bootBytes: boot.memory.heapUsed, loadedBytes: loaded?.memory.heapUsed ?? null, readyBytes: ready.memory.heapUsed, warmBytes: warm.memory.heapUsed, peakBytes: heapPeak },
      rounds, warmupRounds, rssAfterLoadBytes, footprintAfterLoadBytes, ...report }
  } catch (error) {
    await child.kill()
    return { status: error.message.includes('verify-failed') ? 'verify-failed' : 'failed', error: error.message }
  }
}
