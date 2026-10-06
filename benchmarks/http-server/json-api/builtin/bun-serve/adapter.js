export function start() {
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    routes: {
      '/': { GET: () => new Response('Hello, World!', { headers: { 'content-type': 'text/plain' } }) },
      '/users/:id': {
        GET: (req) => Response.json({ id: Number(req.params.id), name: `User ${req.params.id}` }),
      },
      '/echo': { POST: async (req) => Response.json({ echo: await req.json() }) },
    },
    fetch: () => new Response(null, { status: 404 }),
  })
  return { port: server.port, close: () => server.stop(true) }
}
