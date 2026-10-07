import { Agent, request } from 'undici'
let origin, dispatcher
export function connect(peer) {
  origin = peer.origin
  dispatcher = new Agent({ connections: peer.concurrency })
}
const headers = { 'content-type': 'application/json' }
export async function operation(input) {
  const { statusCode, body } = await request(origin + input.path, { method: 'POST', headers, body: input.body, dispatcher })
  if (statusCode !== 201) throw new Error(`status ${statusCode}`)
  return body.json()
}
export function close() {
  return dispatcher.close()
}
