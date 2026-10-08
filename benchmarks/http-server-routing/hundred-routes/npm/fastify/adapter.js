import Fastify from 'fastify'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const app = Fastify()
let out = null
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  // The handler records and does not reply, so no response is built.
  app.route({ method, url: pattern, handler: (request) => { out = { route, params: request.params } } })
}
// Without this Fastify would serialize and send its JSON 404 on every miss.
app.setNotFoundHandler(() => {})
await app.ready()
class Res {}
export const operation = ({ method, path }) => {
  out = null
  app.routing({ method, url: path, headers: {} }, new Res())
  return out
}
