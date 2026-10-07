import http from 'node:http'
import axios from 'axios'
let client, agent
export function connect(peer) {
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
  client = axios.create({ baseURL: peer.origin, httpAgent: agent })
}
export async function operation(input) {
  return (await client.get(input.path)).data
}
export function close() {
  agent.destroy()
}
