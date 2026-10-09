import http from 'node:http'
import { request } from 'gaxios'
let origin, agent
const headers = { 'content-type': 'application/json' }
export function connect(peer) {
  origin = peer.origin
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
}
export async function operation(input) {
  // A string body is sent as it is.
  return (await request({ url: origin + input.path, method: 'POST', headers, body: input.body, agent, retry: false })).data
}
export function close() {
  agent.destroy()
}
