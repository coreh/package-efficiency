// Starts the built adapter-node server inside this process. build/index.js
// is what `node build` runs; it listens as soon as it is imported, on the
// PORT and HOST of the environment, and exports the http server it made.
// PORT=0 asks the system for a free port, read from the server once listening.
process.env.PORT = '0'
process.env.HOST = '127.0.0.1'

export async function start() {
  const { server: http } = await import(new URL('./build/index.js', import.meta.url).href)
  if (!http.listening) await new Promise((resolve, reject) => http.once('listening', resolve).once('error', reject))
  return { port: http.address().port, close: () => {} }
}
