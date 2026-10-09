// Serves the exported Expo Router server build (dist/server) inside this
// process, with the Node http adapter of expo-server: createRequestHandler
// takes the build folder and returns a handler for node:http.
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const dir = path.dirname(fileURLToPath(import.meta.url))
// The package's ES module build imports its own files without extensions, which
// Node and Deno refuse; its CommonJS build, which `require` picks, runs everywhere.
const { createRequestHandler } = createRequire(import.meta.url)('expo-server/adapter/http')

export async function start() {
  const handler = createRequestHandler({ build: path.join(dir, 'dist/server') })
  const server = createServer((request, response) =>
    handler(request, response, (error) => {
      response.statusCode = 500
      response.end(error ? String(error) : 'error')
    })
  )
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve))
  return {
    port: server.address().port,
    close: async () => {
      server.close()
      server.closeAllConnections?.()
    },
  }
}
