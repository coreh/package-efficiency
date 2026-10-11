// The split of the tasks over several machines (shardTasks, measure-all.mjs
// --shard): every task on exactly one machine, tasks that share files together.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adaptersTaskOf, shardTasks, taskIds } from '../../scripts/lib/tasks.mjs'

const tasks = taskIds()

for (const count of [1, 2, 3, 8]) {
  test(`${count} machines: every task is measured once, in the usual order`, () => {
    const shares = Array.from({ length: count }, (_, i) => shardTasks(tasks, i + 1, count).tasks)
    assert.deepEqual(shares.flat().sort(), tasks)
    for (const share of shares) assert.deepEqual(share, tasks.filter((t) => share.includes(t)))
  })
}

test('tasks that share files are on the same machine', () => {
  const machineOf = new Map()
  for (let i = 1; i <= 8; i++) for (const t of shardTasks(tasks, i, 8).tasks) machineOf.set(t, i)
  for (const t of tasks) assert.equal(machineOf.get(t), machineOf.get(adaptersTaskOf(t)), t)
  const web = tasks.filter((t) => t.startsWith('web-application-frameworks/'))
  assert.equal(new Set(web.map((t) => machineOf.get(t))).size, 1)
})

test('the same commit gives the same split', () => {
  assert.deepEqual(shardTasks(tasks, 2, 4), shardTasks(tasks, 2, 4))
})
