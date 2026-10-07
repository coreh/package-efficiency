import { Agent, request } from 'undici'
let origin, dispatcher
export function connect(peer) {
  origin = peer.origin
  dispatcher = new Agent({ connections: peer.concurrency })
}
export async function operation(input) {
  const { statusCode, body } = await request(origin + input.path, { dispatcher })
  if (statusCode !== 200) throw new Error(`status ${statusCode}`)
  return body.json()
}
export function close() {
  return dispatcher.close()
}
