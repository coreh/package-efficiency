// In-process half of a client task for JavaScript runtimes (Node, Bun, Deno).
// The supervisor (harness/client.mjs) has already started the peer; the file
// named by BENCH_CLIENT_TASK says where it listens, what the task fixes and
// the fixture inputs. See "Client tasks" in benchmarks/README.md.
//
// An adapter exports:
//   connect(peer)      optional; once, before anything is measured. `peer` is
//                      { host, port, origin, concurrency, connections }.
//   operation(input)   one exchange with the peer; returns (a promise of)
//                      what the library gives back.
//   describe(result)   optional; the result as plain JSON for the verifier.
//   close()            optional; once, at the end.
//
// A round of `count` exchanges runs on `concurrency` lanes: lane w performs
// exchanges w, w + lanes, w + 2·lanes, … one after another, and exchange k
// uses fixture k mod fixtures. All lanes share this one event loop.
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'
const collect = globalThis.Bun ? () => Bun.gc(true) : globalThis.gc
if (!collect) throw new Error('forced GC unavailable')
const send = (message) => process.stdout.write(`@@${JSON.stringify(message)}\n`)
async function memory() {
  for (let i = 0; i < 3; i++) { collect(); await new Promise((r) => setTimeout(r, 25)) }
  const m = process.memoryUsage()
  return { heapUsed: m.heapUsed + (m.external ?? 0), rss: m.rss }
}
send({ phase: 'boot', pid: process.pid, memory: await memory() })
const before = process.cpuUsage(), started = performance.now()
const adapter = await import(pathToFileURL(process.argv[2]).href)
const importMs = performance.now() - started, cpu = process.cpuUsage(before)
send({ phase: 'loaded', importMs, importCpuMs: (cpu.user + cpu.system) / 1000, memory: await memory() })

const task = JSON.parse(readFileSync(process.env.BENCH_CLIENT_TASK, 'utf8'))
const inputs = task.cases.map((c) => c.input)
const lanes = task.concurrency
const { operation, describe = (result) => result } = adapter
await adapter.connect?.({ host: task.host, port: task.port, origin: `http://${task.host}:${task.port}`, concurrency: lanes, connections: task.connections })

// One exchange per fixture, in order; the supervisor compares what came back
// with the task's expected results and with what the peer recorded.
try {
  const outputs = []
  for (const input of inputs) outputs.push(describe(await operation(input)))
  send({ phase: 'verification', outputs })
} catch (error) {
  send({ phase: 'verify-failed', error: String(error?.message ?? error) })
  process.exit(1)
}

// The measured loop reads only something cheap from each result.
const consume = (result) => (typeof result === 'string' || Array.isArray(result) ? result.length : result == null ? 0 : 1)
async function lane(first, count) {
  let checksum = 0
  for (let k = first; k < count; k += lanes) checksum = (checksum + consume(await operation(inputs[k % inputs.length]))) >>> 0
  return checksum
}

let verified = false
for await (const line of createInterface({ input: process.stdin })) {
  if (line === 'exit') break
  if (line === 'verified') { verified = true; send({ phase: 'ready', memory: await memory() }); continue }
  if (line === 'settle') { send({ phase: 'settled', memory: await memory() }); continue }
  if (!verified) process.exit(1)
  const { count } = JSON.parse(line)
  const cpuBefore = process.cpuUsage(), start = performance.now()
  const sums = await Promise.all(Array.from({ length: lanes }, (_, w) => lane(w, count)))
  const wallMs = performance.now() - start, used = process.cpuUsage(cpuBefore)
  send({ phase: 'round', requests: count, checksum: sums.reduce((a, b) => (a + b) >>> 0, 0), wallMs, cpuMs: (used.user + used.system) / 1000 })
}
await adapter.close?.()
process.exit(0)
