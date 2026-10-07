// Client tasks: the adapter is a client library, and it needs something to
// talk to. The mirror image of measureServer: there the harness is the client
// of the adapter, here it provides the adapter's peer.
//
// The peer is a scripted program (harness/rust/src/bin/*-peer.rs), the same
// for every adapter and language. It is started here, in its own process, on
// 127.0.0.1 and a port the system picks, before the adapter's process exists;
// it is stopped here, whatever happens to the run. Only the adapter's process
// is measured, so the peer's work is charged to nobody.
//
// One operation is one exchange with the peer (a request and its response).
// The task fixes how many are in flight (`load.concurrency` lanes) and how
// many connections the client may open (`load.connections`); the runner in
// the adapter's process keeps exactly that many lanes busy until the round's
// count is done. CPU time is read inside the adapter's process around the
// round, user plus system on all its threads: time spent waiting for the peer
// is not CPU time.
//
// Results are checked from both ends. Before anything is measured the adapter
// performs one exchange per fixture and hands back what it got, which must be
// the task's expected results; the peer must have recorded exactly those
// exchanges and refused nothing. After the warm-up and after every round the
// peer's record is compared again with what the round should have sent.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createInterface } from 'node:readline'
import { launch, rest, rssBytes, footprintBytes } from './supervisor.mjs'

const PEER_TIMEOUT_MS = 10_000

// Starts a peer and waits until it listens. `stats()` returns what it
// received since the last call; `stop()` always ends the process.
export async function startPeer({ command, script, dir }) {
  const file = path.join(dir, 'peer-script.json')
  await writeFile(file, JSON.stringify(script))
  // Its own process group, like the adapter, and outside the adapter's.
  const child = spawn(command, [file], { stdio: ['pipe', 'pipe', 'pipe'], detached: true })
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
      waiter?.reject(new Error(`the peer exited: ${stderr.trim().split('\n').at(-1) ?? ''}`))
      resolve()
    }),
  )
  child.on('error', (error) => waiter?.reject(error))
  const next = (phase) =>
    queue.shift() ??
    new Promise((resolve, reject) => {
      if (exited) return reject(new Error(`the peer exited: ${stderr.trim().split('\n').at(-1) ?? ''}`))
      const timer = setTimeout(() => reject(new Error(`the peer did not answer "${phase}"`)), PEER_TIMEOUT_MS)
      const settle = (fn) => (value) => {
        clearTimeout(timer)
        waiter = null
        fn(value)
      }
      waiter = { resolve: settle(resolve), reject: settle(reject) }
    })
  const stop = async () => {
    if (!exited) {
      try {
        child.stdin.end('exit\n')
      } catch {}
      const timer = setTimeout(() => {
        try {
          process.kill(-child.pid, 'SIGKILL')
        } catch {}
      }, 2_000)
      await closed
      clearTimeout(timer)
    }
  }
  // If the supervisor itself is killed, the peer sees its stdin end and exits.
  const onExit = () => {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch {}
  }
  process.once('exit', onExit)
  try {
    const listening = await next('listening')
    if (listening.phase !== 'listening' || !Number.isInteger(listening.port)) throw new Error('the peer did not say where it listens')
    return {
      port: listening.port,
      pid: listening.pid,
      // How many exchanges its script has: the length of `accepted` in stats.
      exchanges: listening.exchanges,
      async stats() {
        child.stdin.write('stats\n')
        return next('stats')
      },
      async stop() {
        process.removeListener('exit', onExit)
        await stop()
      },
    }
  } catch (error) {
    process.removeListener('exit', onExit)
    onExit()
    throw error
  }
}

// How many times each scripted exchange is sent in a round of `count`:
// exchange k of a round uses fixture k mod fixtures, and each fixture names
// the exchange it performs (`exchange`, an index into the peer's script, or a
// list of them; by default its own position).
function expectedCounts(cases, exchanges, count) {
  const counts = new Array(exchanges).fill(0)
  cases.forEach((c, i) => {
    const times = Math.floor(count / cases.length) + (i < count % cases.length ? 1 : 0)
    // A list: an operation that performs several exchanges (a pipeline).
    for (const exchange of [].concat(c.exchange ?? i)) counts[exchange] += times
  })
  return counts
}

function checkRecord(stats, expected, what) {
  if (stats.refused > 0) throw new Error(`${what}: the peer refused ${stats.refused} request${stats.refused === 1 ? '' : 's'}: ${stats.firstRefusal}`)
  assert.deepEqual(stats.accepted, expected, `${what}: the peer did not receive what the task sends`)
}

// One full run of a client adapter against its peer. The result has the shape
// of measureServer's, with `requests` per round, so the rest of the pipeline
// reads it the same way. `peer` is { command, script }.
export async function measureClient({ command, args, cwd, env, phases, load, verifyResults, cases, peer: peerSpec }) {
  const concurrency = load.concurrency
  const connections = load.connections ?? 2 * concurrency
  const keepAlive = peerSpec.script.keepAlive !== false
  const dir = await mkdtemp(path.join(tmpdir(), 'bench-client-'))
  let peer = null
  let child = null
  try {
    peer = await startPeer({ command: peerSpec.command, script: peerSpec.script, dir })
    const taskFile = path.join(dir, 'client-task.json')
    await writeFile(taskFile, JSON.stringify({ host: '127.0.0.1', port: peer.port, concurrency, connections, cases: cases.map(({ input }) => ({ input })) }))
    child = launch(command, args, cwd, { ...env, BENCH_CLIENT_TASK: taskFile })
    const boot = await child.expect('boot')
    const loaded = phases.includes('loaded') ? await child.expect('loaded') : null

    // One exchange per fixture, checked from both ends, before any timing.
    let opened = 0
    let sent = 0
    const { outputs } = await child.expect('verification')
    try {
      verifyResults(outputs)
      const stats = await peer.stats()
      checkRecord(stats, expectedCounts(cases, peer.exchanges, cases.length), 'verification')
      opened += stats.connections
      sent += cases.length
    } catch (error) {
      await child.kill()
      return { status: 'verify-failed', error: error.message }
    }
    child.command('verified')
    const ready = await child.expect('ready')

    const round = async (count, what) => {
      child.command(JSON.stringify({ count }))
      const { phase, ...result } = await child.expect('round')
      const stats = await peer.stats()
      if (result.requests !== count) throw new Error(`${what}: ${result.requests} exchanges reported, ${count} asked for`)
      checkRecord(stats, expectedCounts(cases, peer.exchanges, count), what)
      opened += stats.connections
      sent += count
      return { ...result, peerCpuMs: stats.cpuMs }
    }
    const settle = async () => {
      child.command('settle')
      return child.expect('settled')
    }

    let peerCpu = (await round(load.warmup, 'warm-up')).peerCpuMs
    await settle()
    // A full rehearsal in the SAME process preserves JIT compilation state.
    const warmupRounds = []
    for (let i = 0; i < load.rounds; i++) {
      const result = await round(load.requestsPerRound, 'rehearsal')
      peerCpu = result.peerCpuMs
      warmupRounds.push({ requests: result.requests, wallMs: result.wallMs, cpuMs: result.cpuMs })
      await settle()
    }
    const warm = await settle()

    const rounds = []
    for (let i = 0; i < load.rounds; i++) {
      const result = await round(load.requestsPerRound, `round ${i + 1}`)
      const settled = await settle()
      rounds.push({
        requests: result.requests,
        cpuMs: result.cpuMs,
        wallMs: result.wallMs,
        latencyP50Ms: null,
        latencyP99Ms: null,
        heapUsedBytes: settled.memory.heapUsed,
        // What the peer spent answering this round: with the wall time, how
        // close the peer was to being the limit (see the README).
        peerCpuMs: result.peerCpuMs - peerCpu,
      })
      peerCpu = result.peerCpuMs
    }

    // Keep-alive or new connections is part of the task, so it is checked.
    if (keepAlive && opened > connections) throw new Error(`the client opened ${opened} connections; the task allows ${connections} keep-alive connections`)
    if (!keepAlive && opened !== sent) throw new Error(`the client opened ${opened} connections for ${sent} exchanges; the task opens a new one for each`)

    await rest()
    const rssAfterLoadBytes = rssBytes(boot.pid), footprintAfterLoadBytes = footprintBytes(boot.pid)
    // Only harnesses with an exact allocator count (Rust) report a heap peak.
    const heapPeakBytes = (await settle()).memory.heapPeak ?? null
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
      connectionsOpened: opened,
      rssAfterLoadBytes, footprintAfterLoadBytes,
      ...report,
    }
  } catch (error) {
    await child?.kill()
    return { status: error.message.includes('verify-failed') ? 'verify-failed' : 'failed', error: error.message }
  } finally {
    await peer?.stop()
    await rm(dir, { recursive: true, force: true })
  }
}
