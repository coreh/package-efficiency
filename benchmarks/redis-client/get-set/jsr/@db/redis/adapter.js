import { connect as redisConnect } from '@db/redis'
let client
export async function connect(peer) {
  client = await redisConnect({ hostname: peer.host, port: peer.port })
}
export function operation(input) {
  return input.command === 'SET' ? client.set(input.key, input.value) : client.get(input.key)
}
export function close() {
  client.close()
}
