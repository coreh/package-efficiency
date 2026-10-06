export function start() {
  const server = Deno.serve({ port: 0, hostname: '127.0.0.1', onListen() {} }, async (req) => {
    const path = new URL(req.url).pathname
    if (req.method === 'GET' && path === '/') {
      return new Response('Hello, World!', { headers: { 'content-type': 'text/plain' } })
    }
    if (req.method === 'GET' && path.startsWith('/users/')) {
      const id = path.slice('/users/'.length)
      return Response.json({ id: Number(id), name: `User ${id}` })
    }
    if (req.method === 'POST' && path === '/echo') {
      return Response.json({ echo: await req.json() })
    }
    return new Response(null, { status: 404 })
  })
  return { port: server.addr.port, close: () => server.shutdown() }
}
