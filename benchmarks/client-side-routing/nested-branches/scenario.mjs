import { strict as assert } from 'node:assert'
// Route tree: 17 sections x 6 routes = 102 routes (see task.md). Every adapter builds exactly this once.
export const sections = ['users', 'orders', 'products', 'invoices', 'carts', 'teams', 'projects', 'tickets', 'posts',
  'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons']
const ids = ['1', '42', '9001', 'a1b2c3', 'u-7f3e', '2026-10-06', 'ünï', 'x_y.z', '00017', 'k9']
export const cases = []
for (let i = 0; i < 52; i++) {
  const s = sections[(i * 5) % sections.length]
  const id = ids[i % ids.length]
  const cid = ids[(i * 3 + 1) % ids.length]
  const k = i % 8
  if (k === 0) cases.push({ input: `/${s}`, expected: { branch: [s, `${s}:index`], params: {} } })
  else if (k === 1) cases.push({ input: `/${s}/new`, expected: { branch: [s, `${s}:new`], params: {} } })
  else if (k === 2) cases.push({ input: `/${s}/${id}`, expected: { branch: [s, `${s}:detail`], params: { id } } })
  else if (k === 3) cases.push({ input: `/${s}/${id}/edit`, expected: { branch: [s, `${s}:detail`, `${s}:edit`], params: { id } } })
  else if (k === 4) cases.push({ input: `/${s}/${id}/comments/${cid}`, expected: { branch: [s, `${s}:detail`, `${s}:comment`], params: { id, commentId: cid } } })
  else if (k === 5) cases.push({ input: `/${s}/${id}/comments`, expected: null })
  else if (k === 6) cases.push({ input: i % 16 === 6 ? `/${s}x/${id}` : `/${s}/${id}/edit/more`, expected: null })
  else cases.push({ input: `/${s}/${id}/comments/${cid}`, expected: { branch: [s, `${s}:detail`, `${s}:comment`], params: { id, commentId: cid } } })
}
cases.push({ input: '/', expected: null }, { input: '/unknown/5', expected: null }, { input: '/settings', expected: null },
  { input: '/users/new/edit', expected: { branch: ['users', 'users:detail', 'users:edit'], params: { id: 'new' } } })
for (const s of ['coupons', 'users', 'tags', 'teams']) cases.push({ input: `/${s}/new`, expected: { branch: [s, `${s}:new`], params: {} } })
const canonical = (r) => {
  if (r === null) return null
  assert.ok(typeof r === 'object' && Array.isArray(r.branch), 'result must be null or { branch, params }')
  return { branch: [...r.branch], params: { ...r.params } }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length, 'one output per fixture is required')
  for (const [i, { expected, input }] of cases.entries()) assert.deepEqual(canonical(outputs[i]), expected, `fixture ${i}: ${input}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (r) => r === null ? 0 : r.branch.length
