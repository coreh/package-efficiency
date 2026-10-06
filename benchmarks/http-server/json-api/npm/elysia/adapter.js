import { Elysia } from 'elysia'

export async function start({ runtime }) {
  // Node needs Elysia's own adapter package; Bun and Deno use the default.
  const adapter = runtime === 'node' ? (await import('@elysiajs/node')).node() : undefined
  const app = new Elysia({ adapter })
    .get('/', () => 'Hello, World!')
    .get('/users/:id', ({ params }) => ({ id: Number(params.id), name: `User ${params.id}` }))
    .post('/echo', ({ body }) => ({ echo: body }))

  if (runtime === 'deno') {
    const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, app.fetch)
    return { port: server.addr.port, close: () => server.shutdown() }
  }
  if (runtime === 'node') {
    // The Node adapter does not report which port it was given, so pick a free one first.
    const { createServer } = await import('node:net')
    const port = await new Promise((resolve) => {
      const probe = createServer().listen(0, '127.0.0.1', () => {
        const { port } = probe.address()
        probe.close(() => resolve(port))
      })
    })
    await new Promise((resolve) => app.listen({ port, hostname: '127.0.0.1' }, resolve))
    return { port, close: () => app.stop() }
  }
  app.listen({ port: 0, hostname: '127.0.0.1' })
  return { port: app.server.port, close: () => app.stop() }
}
