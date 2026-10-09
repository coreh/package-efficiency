import { Client } from '@geacko/redis-client'
import { createConnection } from 'node:net'
import { Readable, Writable } from 'node:stream'
let client
export function connect(peer) {
  // The client takes a { readable, writable, close } gateway (its Node example): a node:net socket as web streams.
  return new Promise((resolve) => {
    const socket = createConnection({ host: peer.host, port: peer.port }, () => {
      socket.pause()
      client = new Client({
        readable: Readable.toWeb(socket),
        writable: Writable.toWeb(socket),
        close() {
          socket.destroy()
        },
      })
      resolve()
    })
  })
}
export function operation(input) {
  return client.send(input.command === 'SET' ? ['SET', input.key, input.value] : ['GET', input.key]).read()
}
export function close() {
  client.close()
}
