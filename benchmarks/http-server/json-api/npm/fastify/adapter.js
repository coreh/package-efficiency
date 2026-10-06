import Fastify from 'fastify'

export async function start() {
  const app = Fastify()
  app.get('/', (request, reply) => {
    reply.type('text/plain').send('Hello, World!')
  })
  app.get('/users/:id', (request) => {
    return { id: Number(request.params.id), name: `User ${request.params.id}` }
  })
  app.post('/echo', (request) => {
    return { echo: request.body }
  })

  await app.listen({ port: 0, host: '127.0.0.1' })
  return { port: app.server.address().port, close: () => app.close() }
}
