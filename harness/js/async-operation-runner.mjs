// Asynchronous operation protocol (task kind "async-operation"): the same
// phases, rounds and figures as operation-runner.mjs, with one awaited call
// per operation. See "Asynchronous operations" in benchmarks/README.md.
//
// What is timed: from before the first call of a batch to after the last
// awaited result, plus one turn of the event loop. An operation's promise
// must settle only when all of its work is done; whatever it left scheduled
// instead (an immediate, a due timer) runs in that last turn and is charged
// to the round. Fixture preparation, verification and GC are outside.
import process from 'node:process'
import { createInterface } from 'node:readline'
import { setImmediate as immediate } from 'node:timers'
import { pathToFileURL } from 'node:url'
const collect = globalThis.Bun ? () => Bun.gc(true) : globalThis.gc
if (!collect) throw new Error('forced GC unavailable')
const send = (message) => process.stdout.write(`@@${JSON.stringify(message)}\n`)
async function memory() {
  for (let i = 0; i < 3; i++) { collect(); await new Promise((r) => setTimeout(r, 25)) }
  const m = process.memoryUsage()
  return { heapUsed: m.heapUsed + (m.external ?? 0), rss: m.rss }
}
const turn = () => new Promise((resolve) => immediate(resolve))
send({ phase: 'boot', pid: process.pid, memory: await memory() })
const before = process.cpuUsage(), started = performance.now()
const { operation: timed, prepare } = await import(pathToFileURL(process.argv[2]).href)
// An adapter may export prepare(input), synchronous or not: it runs once per
// fixture, outside measured work. The verifier hands over the raw input.
const operation = prepare ? Object.assign(async (input) => timed(await prepare(input)), timed) : timed
const importMs = performance.now() - started, cpu = process.cpuUsage(before)
send({ phase: 'loaded', importMs, importCpuMs: (cpu.user + cpu.system) / 1000, memory: await memory() })
const scenario = await import(pathToFileURL(process.argv[3]).href)
const { cases, verify } = scenario
// The warm baseline: the same fixtures and rounds with a do-nothing adapter,
// whose results are not the task's, so nothing is verified or read.
const baseline = process.env.BENCH_BASELINE === '1'
const consume = baseline ? () => 1 : scenario.consume
// The scenario's verify(operation) awaits every result itself.
if (!baseline) try { await verify(operation) } catch (error) { send({ phase: 'verify-failed', error: error.message }); process.exit(1) }
const inputs = []
for (const c of cases) inputs.push(prepare ? await prepare(c.input) : c.input)
// A task on the file system whose operations write (see harness/files.mjs):
// the paths in BENCH_FILES_RESET, all under the task's scratch directory
// BENCH_FILES, are removed before every operation, outside what is timed.
// Operations are awaited one after another, so nothing of the task is in
// flight while they are removed; the units of work inside one operation
// write to different paths under them.
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
    // Each awaited call is timed on its own, so that removing what the call
    // before it wrote is not: only the operations count, in the figure and
    // towards minMs. The last turn of the loop is timed as in any round.
    let wallMs = 0, cpuUs = 0, systemUs = 0
    const timedPart = async (work) => {
      const before = process.cpuUsage(), start = performance.now()
      const result = await work()
      wallMs += performance.now() - start
      const used = process.cpuUsage(before)
      cpuUs += used.user + used.system
      systemUs += used.system
      return result
    }
    do {
      for (let i = 0; i < count; i++) {
        resetFiles()
        const input = inputs[(operations + i) % inputs.length]
        checksum = (checksum + consume(await timedPart(() => timed(input)))) >>> 0
      }
      operations += count
    } while (wallMs < minMs)
    await timedPart(turn)
    send({ phase: 'round', operations, checksum, wallMs, cpuMs: cpuUs / 1000, systemCpuMs: systemUs / 1000 })
    continue
  }
  const cpuBefore = process.cpuUsage(), start = performance.now()
  do {
    for (let i = 0; i < count; i++) checksum = (checksum + consume(await timed(inputs[(operations + i) % inputs.length]))) >>> 0
    operations += count
  } while (performance.now() - start < minMs)
  await turn()
  const wallMs = performance.now() - start, used = process.cpuUsage(cpuBefore)
  send({ phase: 'round', operations, checksum, wallMs, cpuMs: (used.user + used.system) / 1000, systemCpuMs: used.system / 1000 })
}
process.exit(0)
