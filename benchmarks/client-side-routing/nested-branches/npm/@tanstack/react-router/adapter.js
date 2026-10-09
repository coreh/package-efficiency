import { createRouter, createRootRoute, createRoute, createMemoryHistory } from '@tanstack/react-router'
const sections = ['users', 'orders', 'products', 'invoices', 'carts', 'teams', 'projects', 'tickets', 'posts',
  'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons']
const root = createRootRoute()
const r = (parent, id, path, children) => {
  const route = createRoute({ getParentRoute: () => parent, path, staticData: { id } })
  return children ? route.addChildren(children(route)) : route
}
const routeTree = root.addChildren(sections.map((s) => r(root, s, `/${s}`, (sec) => [
  r(sec, `${s}:index`, '/'),
  r(sec, `${s}:new`, 'new'),
  r(sec, `${s}:detail`, '$id', (d) => [r(d, `${s}:edit`, 'edit'), r(d, `${s}:comment`, 'comments/$commentId')])
])))
const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
export const operation = (path) => {
  const [matched, params, found] = router.getMatchedRoutes(path)
  if (found === undefined || params['**'] !== undefined) return null
  return { branch: matched.slice(1).map((x) => x.options.staticData.id), params }
}
