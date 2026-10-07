import { matchRoutes } from 'react-router'
const sections = ['users', 'orders', 'products', 'invoices', 'carts', 'teams', 'projects', 'tickets', 'posts',
  'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons']
const routes = sections.map((s) => ({
  id: s, path: `/${s}`, children: [
    { id: `${s}:index`, index: true },
    { id: `${s}:new`, path: 'new' },
    { id: `${s}:detail`, path: ':id', children: [
      { id: `${s}:edit`, path: 'edit' },
      { id: `${s}:comment`, path: 'comments/:commentId' }
    ] }
  ]
}))
export const operation = (path) => {
  const m = matchRoutes(routes, path)
  if (m === null) return null
  return { branch: m.map((x) => x.route.id), params: m[m.length - 1].params }
}
