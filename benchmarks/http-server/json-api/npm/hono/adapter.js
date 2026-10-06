import { Hono } from 'hono'

export async function start({ runtime }) {
  const app = new Hono()
  app.get('/', (c) => c.text('Hello, World!'))
  app.get('/users/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id: Number(id), name: `User ${id}` })
  })
  app.post('/echo', async (c) => c.json({ echo: await c.req.json() }))

  if (runtime === 'bun') {
    const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: app.fetch })
    return { port: server.port, close: () => server.stop(true) }
  }
  if (runtime === 'deno') {
    const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, app.fetch)
    return { port: server.addr.port, close: () => server.shutdown() }
  }
  const { serve } = await import('@hono/node-server')
  return new Promise((resolve) => {
    const server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' }, (info) =>
      resolve({ port: info.port, close: () => server.close() }),
    )
  })
}
