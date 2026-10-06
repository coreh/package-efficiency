// In-process half of the benchmark protocol for JavaScript runtimes. Runs
// unchanged on Node, Bun and Deno. The supervisor (harness/supervisor.mjs)
// reads `@@{json}` lines from stdout and writes commands to stdin.
// Usage: <runtime> runner.mjs <adapter.js | ->   ("-" measures the empty baseline)
import process from 'node:process'
import { createInterface } from 'node:readline'
import { pathToFileURL } from 'node:url'

const runtime = globalThis.Bun ? 'bun' : globalThis.Deno ? 'deno' : 'node'
const collect = globalThis.Bun ? () => globalThis.Bun.gc(true) : globalThis.gc
if (!collect) throw new Error('forced GC is unavailable; start the runtime with --expose-gc')

const send = (message) => process.stdout.write(`@@${JSON.stringify(message)}\n`)

// Finalizers and weak references are only cleared on a later pass, so collect
// a few times with an event-loop turn in between before reading the heap.
async function settledMemory() {
  for (let i = 0; i < 3; i++) {
    collect()
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  const usage = process.memoryUsage()
  return { heapUsed: usage.heapUsed + (usage.external ?? 0), rss: usage.rss }
}

const adapterPath = process.argv[2]
send({ phase: 'boot', pid: process.pid, runtime, memory: await settledMemory() })

let instance = null
if (adapterPath !== '-') {
  const cpuBefore = process.cpuUsage()
  const startedAt = performance.now()
  const adapter = await import(pathToFileURL(adapterPath).href)
  const importMs = performance.now() - startedAt
  const cpu = process.cpuUsage(cpuBefore)
  send({ phase: 'loaded', importMs, importCpuMs: (cpu.user + cpu.system) / 1000, memory: await settledMemory() })

  instance = await adapter.start({ runtime })
  send({ phase: 'ready', port: instance.port ?? 0, memory: await settledMemory() })
} else {
  send({ phase: 'ready', port: 0, memory: await settledMemory() })
}

for await (const line of createInterface({ input: process.stdin })) {
  if (line === 'settle') send({ phase: 'settled', memory: await settledMemory() })
  else if (line === 'exit') break
}
await instance?.close?.()
process.exit(0)
