// Starts Mastro's file-based fetch handler on a node:http server, which is how
// Mastro's own Node example serves it (@remix-run/node-fetch-server turns the
// handler into a request listener). The same code runs on Node, Bun and Deno.
import http from 'node:http'
import { createRequestListener } from '@remix-run/node-fetch-server'
import { createHandler } from '@mastrojs/mastro/server-filebased'

export async function start() {
  // Reads routes/ and generated/ from the working directory.
  const server = http.createServer(createRequestListener(createHandler()))
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  return { port: server.address().port, close: () => {} }
}
