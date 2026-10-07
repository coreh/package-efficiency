import { RedisClient } from 'bun'
let client
export async function connect(peer) {
  client = new RedisClient(`redis://${peer.host}:${peer.port}`)
  await client.connect()
}
export function operation(input) {
  return input.command === 'SET' ? client.set(input.key, input.value) : client.get(input.key)
}
export function close() {
  client.close()
}
