import { createRouter, createMemoryHistory } from 'vue-router'
const sections = ['users', 'orders', 'products', 'invoices', 'carts', 'teams', 'projects', 'tickets', 'posts',
  'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons']
const component = {}
const r = (id, path, children) => ({ path, component, meta: { id }, ...(children && { children }) })
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    ...sections.map((s) => r(s, `/${s}`, [
      r(`${s}:index`, ''),
      r(`${s}:new`, 'new'),
      r(`${s}:detail`, ':id', [r(`${s}:edit`, 'edit'), r(`${s}:comment`, 'comments/:commentId')])
    ])),
    r('*', '/:pathMatch(.*)*')
  ]
})
export const operation = (path) => {
  const { matched, params } = router.resolve(path)
  const branch = matched.map((x) => x.meta.id)
  if (branch[0] === '*') return null
  return { branch, params }
}
