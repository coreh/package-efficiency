import FindMyWay from 'find-my-way'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const router = FindMyWay()
// The fourth argument is find-my-way's per-route store; find() hands it back.
for (const [method, pattern] of routes) router.on(method, pattern, () => {}, { route: `${method} ${pattern}` })
export const operation = ({ method, path }) => {
  const found = router.find(method, path)
  return found === null ? null : { route: found.store.route, params: found.params }
}
