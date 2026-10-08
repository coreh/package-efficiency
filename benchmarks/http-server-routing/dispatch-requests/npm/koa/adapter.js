import Koa from 'koa'
import Router from '@koa/router'
const resources = ['users', 'orders', 'products', 'invoices', 'carts', 'sessions', 'teams', 'projects', 'tickets', 'comments',
  'posts', 'tags', 'files', 'folders', 'devices', 'alerts', 'reports', 'payments', 'coupons', 'reviews',
  'regions', 'warehouses', 'shipments', 'accounts', 'webhooks']
const routes = resources.flatMap((r) => [['GET', `/api/${r}`], ['POST', `/api/${r}`], ['GET', `/api/${r}/:id`], ['PUT', `/api/${r}/:id`]])
const router = new Router()
let out = null
const verbs = { GET: 'get', POST: 'post', PUT: 'put' }
for (const [method, pattern] of routes) {
  const route = `${method} ${pattern}`
  // respond = false: Koa is told not to write a response for this request.
  router[verbs[method]](pattern, (ctx) => { out = { route, params: ctx.params }; ctx.respond = false })
}
const app = new Koa()
app.use(router.routes())
const handle = app.callback()
// A stand-in for http.ServerResponse with what Koa touches: it sets the 404
// status first, watches for the end, and on a miss writes its 404 text.
class Res {
  statusCode = 200
  headersSent = false
  finished = false
  writableEnded = false
  socket = null
  headers = {}
  on() { return this }
  setHeader(name, value) { this.headers[name.toLowerCase()] = value }
  getHeader(name) { return this.headers[name.toLowerCase()] }
  hasHeader(name) { return name.toLowerCase() in this.headers }
  removeHeader(name) { delete this.headers[name.toLowerCase()] }
  getHeaders() { return this.headers }
  getHeaderNames() { return Object.keys(this.headers) }
  end() { this.finished = true }
}
// Not timed: runs once per fixture. The URL is escaped as a client sends it.
export const prepare = ({ method, path }) => ({ method, url: encodeURI(path), headers: {}, socket: null })
export const operation = async (req) => {
  out = null
  await handle(req, new Res())
  return out
}
