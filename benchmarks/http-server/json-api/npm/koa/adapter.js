import Koa from 'koa'
import Router from '@koa/router'
import { bodyParser } from '@koa/bodyparser'

export function start() {
  const router = new Router()
  router.get('/', (ctx) => {
    ctx.type = 'text/plain'
    ctx.body = 'Hello, World!'
  })
  router.get('/users/:id', (ctx) => {
    ctx.body = { id: Number(ctx.params.id), name: `User ${ctx.params.id}` }
  })
  router.post('/echo', bodyParser(), (ctx) => {
    ctx.body = { echo: ctx.request.body }
  })

  const app = new Koa()
  app.use(router.routes())

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () =>
      resolve({ port: server.address().port, close: () => server.close() }),
    )
  })
}
