import { Elysia } from 'elysia'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const app = new Elysia()
// One response made once and returned by every handler, so none is built per call.
const done = new Response(null)
let out = null
const verbs = { GET: 'get', POST: 'post', PUT: 'put' }
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  app[verbs[method]](pattern, ({ params }) => { out = { route, params }; return done })
}
const handle = app.fetch
// Not timed: runs once per fixture.
export const prepare = ({ method, path }) => new Request(`http://localhost${path}`, { method })
export const operation = (request) => {
  out = null
  const response = handle(request)
  if (response instanceof Promise) throw new Error('Elysia answered asynchronously')
  return out
}
