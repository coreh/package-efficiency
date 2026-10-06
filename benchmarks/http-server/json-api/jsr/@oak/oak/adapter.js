import { Application, Router } from '@oak/oak'

export async function start({ runtime }) {
  // Oak's Node adapter reports the requested port, not the bound ephemeral
  // port. Reserve an available number before starting, as with Elysia/Node.
  let port = 0
  if (runtime === 'node') {
    const { createServer } = await import('node:net')
    port = await new Promise(resolve => {
      const probe = createServer().listen(0, '127.0.0.1', () => {
        const selected = probe.address().port
        probe.close(() => resolve(selected))
      })
    })
  }
  const router = new Router()
  router.get('/', ctx => { ctx.response.type = 'text/plain'; ctx.response.body = 'Hello, World!' })
  router.get('/users/:id', ctx => { const id = ctx.params.id; ctx.response.body = { id: Number(id), name: `User ${id}` } })
  router.post('/echo', async ctx => { ctx.response.body = { echo: await ctx.request.body.json() } })
  const app = new Application()
  app.use(router.routes())
  const controller = new AbortController()
  return new Promise((resolve, reject) => {
    let listening
    app.addEventListener('listen', event => resolve({ port: event.port, close: async () => { controller.abort(); await listening } }), { once: true })
    listening = app.listen({ hostname: '127.0.0.1', port, signal: controller.signal })
    listening.catch(reject)
  })
}
