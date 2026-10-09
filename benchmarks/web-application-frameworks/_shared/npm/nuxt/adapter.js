// Starts the built Nuxt application inside this process: the Nitro
// node-server output (.output/server/index.mjs), which is what `node
// .output/server/index.mjs` runs. That entry listens as soon as it is
// imported, on the port and host in the environment (NITRO_PORT, NITRO_HOST),
// and does not export its server. Nitro 2 reads port 0 as "not set" and falls
// back to 3000, so a free port is asked of the system first and handed over,
// and the entry's "Listening on" line is waited for:
//   Listening on http://127.0.0.1:53124
import { createServer } from 'node:net'
import process from 'node:process'

const LISTENING = /Listening on:?\s*(?:\u001B\[\d+m)*https?:\/\/[^\s/]*:(\d+)/

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer().once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
  })

export async function start() {
  const wanted = await freePort()
  process.env.NITRO_PORT = String(wanted)
  process.env.NITRO_HOST = '127.0.0.1'

  const log = console.log
  let timer
  const listening = new Promise((resolve, reject) => {
    console.log = (...args) => {
      const port = LISTENING.exec(args.join(' '))?.[1]
      if (port) resolve(Number(port))
      log(...args)
    }
    timer = setTimeout(() => reject(new Error('the server did not say what port it listens on')), 10000)
  })
  try {
    await import(new URL('./.output/server/index.mjs', import.meta.url).href)
    const port = await listening
    // The entry keeps its server to itself; the runner ends the process.
    return { port, close: () => {} }
  } finally {
    clearTimeout(timer)
    console.log = log
  }
}
