// Starts the built Astro Node server inside this process: dist/server/entry.mjs,
// the entry that `node ./dist/server/entry.mjs` runs. With the documented
// ASTRO_NODE_AUTOSTART=disabled it does not listen on import and exports
// startServer(), the very function it would have called itself. It is given
// HOST=127.0.0.1 and PORT=0 (a free port, read from the server once listening).
process.env.ASTRO_NODE_AUTOSTART = 'disabled'
process.env.HOST = '127.0.0.1'
process.env.PORT = '0'

export async function start() {
  const { startServer } = await import(new URL('./dist/server/entry.mjs', import.meta.url).href)
  const { server } = startServer().server
  if (!server.listening) await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject))
  return { port: server.address().port, close: () => {} }
}
