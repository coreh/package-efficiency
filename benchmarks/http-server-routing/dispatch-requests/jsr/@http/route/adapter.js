import { handle } from '@http/route/handle'
import { byPattern } from '@http/route/by-pattern'
import { byMethod } from '@http/route/by-method'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
let out = null
// One Response made at start-up, returned by every handler.
const ok = new Response(null)
const handlers = []
// A pattern handler per path, with byMethod choosing among the methods registered
// for it: the library's documented composition. Each route has its own handler.
for (const r of resources) {
  const record = (route, decode) => (_req, match) => {
    out = { route, params: decode ? { id: decodeURIComponent(match.pathname.groups.id) } : {} }
    return ok
  }
  handlers.push(byPattern(`/api/${r}`, byMethod({ GET: record(`GET /api/${r}`), POST: record(`POST /api/${r}`) })))
  handlers.push(byPattern(`/api/${r}/:id`, byMethod({ GET: record(`GET /api/${r}/:id`, true), PUT: record(`PUT /api/${r}/:id`, true) })))
}
const app = handle(handlers)
export const prepare = ({ method, path }) => new Request(`http://localhost${path}`, { method })
export const operation = async (request) => {
  out = null
  await app(request)
  return out
}
