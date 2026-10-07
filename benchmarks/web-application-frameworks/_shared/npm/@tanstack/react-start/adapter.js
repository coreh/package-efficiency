// Starts the built TanStack Start application inside this process: the Nitro
// node-server output (.output/server/index.mjs), which is what `npm run start`
// runs. That entry listens as soon as it is imported, on the port and host in
// the environment (NITRO_PORT, NITRO_HOST), and does not export its server.
// So it is given port 0, for the system to choose a free one, and the port is
// read from the line Nitro's server prints once it is listening:
//   ➜ Listening on: http://127.0.0.1:53124/
import process from 'node:process'

const LISTENING = /Listening on:\s*(?:\u001B\[\d+m)*https?:\/\/[^\s/]*:(\d+)\//

export async function start() {
  process.env.NITRO_PORT = '0'
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
    // BENCH_OUTPUT is the folder this form of the application was built into.
    await import(new URL(`./${process.env.BENCH_OUTPUT || '.output'}/server/index.mjs`, import.meta.url).href)
    const port = await listening
    // The entry keeps its server to itself; the runner ends the process.
    return { port, close: () => {} }
  } finally {
    clearTimeout(timer)
    console.log = log
  }
}
