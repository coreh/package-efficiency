import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runtimeScores } from '../pages.mjs'

test('runtime memory uses total after-task RSS even when package baseline deltas rank oppositely', () => {
  const entry = (packageRatio, totalRatio) => ({
    grades: { cpu: { ratio: 1 }, memory: { ratio: packageRatio } },
    runtimeGrades: { memory: { ratio: totalRatio } },
  })
  const node = entry(1, 2), bun = entry(3, 1)
  const scale = [1.5, 3, 6, 12, 25, 50]
  const scores = runtimeScores([{ metrics: { cpu: { scale }, memory: { scale } }, runtimes: [
    { id: 'node', entries: [node] }, { id: 'bun', entries: [bun] },
  ] }], { runtimes: [{ id: 'node' }, { id: 'bun' }] })
  const get = id => scores.find(s => s.runtime.id === id).memory
  assert.equal(get('bun').best.ratio, 1)
  assert.equal(get('bun').best.class, 'A')
  assert.equal(get('node').best.ratio, 2)
  assert.equal(get('node').best.class, 'B')
  assert.equal(node.grades.memory.ratio, 1)
  assert.equal(bun.grades.memory.ratio, 3)
})
