import http from 'node:http'
import axios from 'axios'
let client, agent
export function connect(peer) {
  agent = new http.Agent({ keepAlive: true, maxSockets: peer.concurrency })
  client = axios.create({ baseURL: peer.origin, httpAgent: agent, headers: { post: { 'Content-Type': 'application/json' } } })
}
export async function operation(input) {
  // A string body is sent as it is.
  return (await client.post(input.path, input.body)).data
}
export function close() {
  agent.destroy()
}
