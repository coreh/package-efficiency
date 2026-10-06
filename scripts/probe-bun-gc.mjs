// Diagnostic only; run outside benchmark measurements with the pinned Bun.
import { heapStats } from 'bun:jsc'
import assert from 'node:assert/strict'
const samples = []
function sample(phase) {
  const { heapSize, heapCapacity, objectCount, extraMemorySize } = heapStats()
  samples.push({ phase, heapSize, heapCapacity, objectCount, extraMemorySize, ...process.memoryUsage() })
}
async function settle() {
  for (let i = 0; i < 3; i++) { Bun.gc(true); await new Promise(resolve => setTimeout(resolve, 25)) }
}
await settle()
sample('baseline')
globalThis.gcProbeObjects = Array.from({ length: 100000 }, (_, i) => ({ i, values: [i, i + 1, i + 2], text: `gc-probe-${i}` }))
await settle()
sample('live')
globalThis.gcProbeObjects = null
await settle()
sample('released')
console.log(JSON.stringify({ runtime: Bun.version, gc: 'Bun.gc(true), three passes with 25 ms pauses', samples }, null, 2))
assert.ok(samples[1].objectCount - samples[2].objectCount > 100000, 'GC did not reclaim the diagnostic objects')
assert.ok(samples[2].heapSize < samples[1].heapSize / 2, 'Heap did not shrink after releasing the objects')
