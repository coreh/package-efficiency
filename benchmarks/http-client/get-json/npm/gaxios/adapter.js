import http from 'node:http'
import { request } from 'gaxios'
let origin, agent
export function connect(peer) {
  origin = peer.origin
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
}
export async function operation(input) {
  return (await request({ url: origin + input.path, agent, retry: false })).data
}
export function close() {
  agent.destroy()
}
