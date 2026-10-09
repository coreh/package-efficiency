import { Router } from '@oak/acorn'

export async function start({ runtime }) {
  // The Node server adapter reports the requested port, not the bound one.
  // Reserve an available number first, as the Oak adapter does.
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
  router.get('/', () => new Response('Hello, World!', { headers: { 'content-type': 'text/plain' } }))
  router.get('/users/:id', ctx => ({ id: Number(ctx.params.id), name: `User ${ctx.params.id}` }))
  router.post('/echo', async ctx => ({ echo: await ctx.body() }))
  const controller = new AbortController()
  return new Promise((resolve, reject) => {
    const listening = router.listen({
      hostname: '127.0.0.1',
      port,
      signal: controller.signal,
      onListen: addr => resolve({ port: addr.port, close: async () => { controller.abort(); await listening } }),
    })
    listening.catch(reject)
  })
}
