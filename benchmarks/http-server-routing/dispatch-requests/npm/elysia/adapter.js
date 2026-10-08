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
// Not timed: runs once per fixture. A Request is reusable while its body is unread.
export const prepare = ({ method, path }) => new Request(`http://localhost${path}`, { method })
export const operation = async (request) => {
  out = null
  await app.handle(request)
  return out
}
