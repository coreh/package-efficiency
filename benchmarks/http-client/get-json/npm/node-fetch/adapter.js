import http from 'node:http'
import fetch from 'node-fetch'
let origin, agent
export function connect(peer) {
  origin = peer.origin
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
}
export async function operation(input) {
  const response = await fetch(origin + input.path, { agent })
  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}
export function close() {
  agent.destroy()
}
