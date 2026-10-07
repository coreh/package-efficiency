import Router from 'router'
const router = Router()
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const verbs = { GET: 'get', POST: 'post', PUT: 'put' }
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  router[verbs[method]](pattern, (req, res) => { res.out = { route, params: req.params } })
}
export const operation = ({ method, path }) => {
  const res = { out: null }
  router({ method, url: path, headers: {} }, res, () => {})
  return res.out
}
