import { Hono } from 'hono'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const app = new Hono()
// The handlers are never called here: the route record Hono keeps beside each
// handler (method and path as registered) is what the router gives back.
for (const [method, pattern] of routes) app.on(method, pattern, (c) => c.body(null))
const router = app.router
export const operation = ({ method, path }) => {
  const [handlers, stash] = router.match(method, path)
  if (handlers.length === 0) return null
  const [[, route], found] = handlers[0]
  // Hono's routers answer either with the values or with indexes into a stash.
  const params = {}
  for (const name in found) params[name] = stash ? stash[found[name]] : found[name]
  return { route: `${route.method} ${route.path}`, params }
}
