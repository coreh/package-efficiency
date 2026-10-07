import http from 'node:http'
import got from 'got'
let client, agent
export function connect(peer) {
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
  client = got.extend({ prefixUrl: peer.origin, agent: { http: agent }, retry: { limit: 0 } })
}
export function operation(input) {
  // prefixUrl takes the path without its leading slash.
  return client.get(input.path.slice(1)).json()
}
export function close() {
  agent.destroy()
}
