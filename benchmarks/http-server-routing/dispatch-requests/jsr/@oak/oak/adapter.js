import { Application, Router } from '@oak/oak'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const router = new Router()
let out = null
const verbs = { GET: 'get', POST: 'post', PUT: 'put' }
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  // respond = false: oak is told not to make a response for this request.
  router[verbs[method]](pattern, (ctx) => { out = { route, params: ctx.params }; ctx.respond = false })
}
const app = new Application()
app.use(router.routes())
// Not timed: runs once per fixture. A Request is reusable while its body is unread.
export const prepare = ({ method, path }) => new Request(`http://localhost${path}`, { method })
export const operation = async (request) => {
  out = null
  await app.handle(request)
  return out
}
