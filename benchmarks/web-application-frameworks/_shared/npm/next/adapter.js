// Starts Next's production server inside this process, the way Next documents
// a custom server: next({ dev: false }), prepare(), and an http server whose
// only handler is Next's own request handler. Every route is answered by Next.
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import next from 'next'

const dir = path.dirname(fileURLToPath(import.meta.url))
const hostname = '127.0.0.1'

export async function start() {
  let handle = null
  const server = createServer((request, response) => handle(request, response))
  // The port is taken first, because Next is told the address it is served on.
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, hostname, resolve))
  const { port } = server.address()

  const app = next({ dev: false, dir, hostname, port })
  await app.prepare()
  handle = app.getRequestHandler()

  return {
    port,
    close: async () => {
      server.close()
      server.closeAllConnections?.()
      await app.close?.()
    },
  }
}
