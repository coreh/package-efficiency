// Synchronous operation protocol: fixture construction, verification and GC
// are outside measured batches. The checksum makes results observable.
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
const { operation: timed, prepare } = await import(pathToFileURL(process.argv[2]).href)
// An adapter may export prepare(input): it runs once per fixture, outside
// measured work, to turn the fixture's JSON into what the library takes
// (bytes, typed records). The verifier still hands over the raw input.
// Anything the adapter attached to its operation for the verifier (a decode
// helper, say) stays reachable.
const operation = prepare ? Object.assign((input) => timed(prepare(input)), timed) : timed
const importMs = performance.now() - started, cpu = process.cpuUsage(before)
send({ phase: 'loaded', importMs, importCpuMs: (cpu.user + cpu.system) / 1000, memory: await memory() })
const scenario = await import(pathToFileURL(process.argv[3]).href)
const { cases, verify } = scenario
// The warm baseline: the same fixtures and rounds with a do-nothing adapter,
// whose results are not the task's, so nothing is verified or read.
const baseline = process.env.BENCH_BASELINE === '1'
const consume = baseline ? () => 1 : scenario.consume
if (!baseline) try { verify(operation) } catch (error) { send({ phase: 'verify-failed', error: error.message }); process.exit(1) }
const inputs = cases.map((c) => (prepare ? prepare(c.input) : c.input))
// A task on the file system whose operations write (see harness/files.mjs):
// the paths in BENCH_FILES_RESET, all under the task's scratch directory
// BENCH_FILES, are removed before every operation, outside what is timed.
let resetFiles = null
if (process.env.BENCH_FILES_RESET) {
  const { rmSync } = await import('node:fs')
  const paths = JSON.parse(process.env.BENCH_FILES_RESET)
  if (!paths.every((p) => p.startsWith(process.env.BENCH_FILES + '/'))) throw new Error('BENCH_FILES_RESET names a path outside BENCH_FILES')
  resetFiles = () => { for (const p of paths) rmSync(p, { recursive: true, force: true }) }
}
send({ phase: 'ready', memory: await memory() })
for await (const line of createInterface({ input: process.stdin })) {
  if (line === 'exit') break
  if (line === 'settle') { send({ phase: 'settled', memory: await memory() }); continue }
  const { count, minMs = 0 } = JSON.parse(line)
  let checksum = 0, operations = 0
  if (resetFiles) {
    // Each call is timed on its own, so that removing what the call before it
    // wrote is not: only the operations count, in the figure and towards minMs.
    let wallMs = 0, cpuUs = 0, systemUs = 0
    do {
      for (let i = 0; i < count; i++) {
        resetFiles()
        const input = inputs[(operations + i) % inputs.length], before = process.cpuUsage(), start = performance.now()
        const result = timed(input)
        wallMs += performance.now() - start
        const used = process.cpuUsage(before)
        cpuUs += used.user + used.system
        systemUs += used.system
        checksum = (checksum + consume(result)) >>> 0
      }
      operations += count
    } while (wallMs < minMs)
    send({ phase: 'round', operations, checksum, wallMs, cpuMs: cpuUs / 1000, systemCpuMs: systemUs / 1000 })
    continue
  }
  const cpuBefore = process.cpuUsage(), start = performance.now()
  do {
    for (let i = 0; i < count; i++) checksum = (checksum + consume(timed(inputs[(operations + i) % inputs.length]))) >>> 0
    operations += count
  } while (performance.now() - start < minMs)
  const wallMs = performance.now() - start, used = process.cpuUsage(cpuBefore)
  send({ phase: 'round', operations, checksum, wallMs, cpuMs: (used.user + used.system) / 1000, systemCpuMs: used.system / 1000 })
}
process.exit(0)
