import { strict as assert } from 'node:assert'
// 100 routes: 25 resources x { GET list, POST create, GET one, PUT update }.
// Every adapter registers exactly these, once, outside the measured call.
export const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
export const routes = resources.flatMap((r) => [
  ['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`],
])
const ids = ['1', '42', '9001', 'a1b2c3', 'u-7f3e', '2026-10-06', 'ünï', 'x_y.z', '00017', 'k9']
export const cases = []
for (let i = 0; i < 48; i++) {
  const r = resources[(i * 7) % resources.length]
  const id = ids[i % ids.length]
  const k = i % 6
  if (k === 0) cases.push({ input: { method: 'GET', path: `/api/${r}` }, expected: { route: `GET /api/${r}`, params: {} } })
  else if (k === 1) cases.push({ input: { method: 'POST', path: `/api/${r}` }, expected: { route: `POST /api/${r}`, params: {} } })
  else if (k === 2) cases.push({ input: { method: 'GET', path: `/api/${r}/${id}` }, expected: { route: `GET /api/${r}/:id`, params: { id } } })
  else if (k === 3) cases.push({ input: { method: 'PUT', path: `/api/${r}/${id}` }, expected: { route: `PUT /api/${r}/:id`, params: { id } } })
  else if (k === 4) cases.push({ input: { method: i % 2 ? 'DELETE' : 'POST', path: `/api/${r}/${id}` }, expected: null })
  else cases.push({ input: { method: 'GET', path: i % 2 ? `/api/${r}x/${id}` : `/api/${r}/${id}/extra` }, expected: null })
}
cases.push({ input: { method: 'GET', path: '/' }, expected: null }, { input: { method: 'GET', path: '/api' }, expected: null },
  { input: { method: 'GET', path: '/health' }, expected: null }, { input: { method: 'GET', path: '/api/unknown/5' }, expected: null })
for (const r of ['webhooks', 'users', 'warehouses', 'tags']) cases.push({ input: { method: 'GET', path: `/api/${r}/last` }, expected: { route: `GET /api/${r}/:id`, params: { id: 'last' } } })
for (const r of ['coupons', 'files', 'teams', 'alerts']) cases.push({ input: { method: 'PUT', path: `/api/${r}/7` }, expected: { route: `PUT /api/${r}/:id`, params: { id: '7' } } })
const canonical = (r) => {
  if (r === null) return null
  assert.ok(typeof r === 'object' && typeof r.route === 'string', 'result must be null or { route, params }')
  return { route: r.route, params: { ...r.params } }
}
export const verifyResults = (outputs) => {
  assert.ok(Array.isArray(outputs), 'outputs must be an array')
  assert.equal(outputs.length, cases.length)
  for (const [i, { expected, input }] of cases.entries()) assert.deepEqual(canonical(outputs[i]), expected, `fixture ${i}: ${input.method} ${input.path}`)
}
export const verify = (operation) => verifyResults(cases.map(({ input }) => operation(input)))
export const consume = (r) => r === null ? 0 : r.route.length
