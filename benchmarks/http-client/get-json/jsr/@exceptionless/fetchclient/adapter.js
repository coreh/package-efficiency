import { FetchClient } from '@exceptionless/fetchclient'
let client, origin
export function connect(peer) {
  origin = peer.origin
  client = new FetchClient()
}
export async function operation(input) {
  const response = await client.getJSON(origin + input.path)
  // A non-2xx status throws; a body that does not parse only fills response.problem.
  if (!response.ok || response.data === null) throw new Error(`status ${response.status}`)
  return response.data
}
