import { Hono } from 'hono'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const app = new Hono()
// One response made once and returned by every handler, so none is built per call.
const done = new Response(null)
let out = null
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  app.on(method, pattern, (c) => { out = { route, params: c.req.param() }; return done })
}
// Not timed: runs once per fixture. A Request is reusable while its body is unread.
export const prepare = ({ method, path }) => new Request(`http://localhost${path}`, { method })
export const operation = async (request) => {
  out = null
  await app.fetch(request)
  return out
}
