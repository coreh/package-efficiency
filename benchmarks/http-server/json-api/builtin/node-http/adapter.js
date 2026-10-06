import { createServer } from 'node:http'

const json = (res, value) => {
  const body = JSON.stringify(value)
  res.writeHead(200, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) })
  res.end(body)
}

export function start() {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'content-type': 'text/plain', 'content-length': 13 })
      res.end('Hello, World!')
    } else if (req.method === 'GET' && req.url.startsWith('/users/')) {
      const id = req.url.slice('/users/'.length)
      json(res, { id: Number(id), name: `User ${id}` })
    } else if (req.method === 'POST' && req.url === '/echo') {
      const chunks = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => json(res, { echo: JSON.parse(Buffer.concat(chunks).toString()) }))
    } else {
      res.writeHead(404).end()
    }
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, close: () => server.close() }))
  })
}
