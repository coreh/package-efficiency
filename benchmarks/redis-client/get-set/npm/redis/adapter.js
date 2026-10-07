import { createClient } from 'redis'
let client
export async function connect(peer) {
  client = createClient({ socket: { host: peer.host, port: peer.port } })
  await client.connect()
}
export function operation(input) {
  return input.command === 'SET' ? client.set(input.key, input.value) : client.get(input.key)
}
export function close() {
  client.destroy()
}
