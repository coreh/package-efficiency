import { Redis } from 'ioredis'
let client
export async function connect(peer) {
  client = new Redis({ host: peer.host, port: peer.port, lazyConnect: true })
  await client.connect()
}
export function operation(input) {
  return input.command === 'SET' ? client.set(input.key, input.value) : client.get(input.key)
}
export function close() {
  client.disconnect()
}
