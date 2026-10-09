import { RedisClient } from '@iuioiua/redis'
import { createConnection } from 'node:net'
import { Readable, Writable } from 'node:stream'
let client, socket
export async function connect(peer) {
  // The client takes any { readable, writable } pair of web streams; a socket of node:net gives one on Node, Bun and Deno.
  socket = createConnection({ host: peer.host, port: peer.port })
  await new Promise((resolve, reject) => socket.once('connect', resolve).once('error', reject))
  client = new RedisClient({ readable: Readable.toWeb(socket), writable: Writable.toWeb(socket) })
}
export function operation(input) {
  return client.sendCommand(input.command === 'SET' ? ['SET', input.key, input.value] : ['GET', input.key])
}
export function close() {
  socket.destroy()
}
