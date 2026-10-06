import process from 'node:process'
import express from 'express'

export function start() {
  const app = express()
  // The tuned variant: no per-response ETag hash, no X-Powered-By header.
  if (process.env.BENCH_EXPRESS_LEAN) {
    app.disable('etag')
    app.disable('x-powered-by')
  }
  app.get('/', (req, res) => {
    res.type('text/plain').send('Hello, World!')
  })
  app.get('/users/:id', (req, res) => {
    res.json({ id: Number(req.params.id), name: `User ${req.params.id}` })
  })
  app.post('/echo', express.json(), (req, res) => {
    res.json({ echo: req.body })
  })

  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () =>
      resolve({ port: server.address().port, close: () => server.close() }),
    )
  })
}
