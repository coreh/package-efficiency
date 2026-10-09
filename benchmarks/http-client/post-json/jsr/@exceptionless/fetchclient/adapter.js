import { FetchClient } from '@exceptionless/fetchclient'
let client, origin
// Options replace postJSON's own headers, so its Accept header is given again with the type.
const options = { headers: { 'Accept': 'application/json, application/problem+json', 'Content-Type': 'application/json' } }
export function connect(peer) {
  origin = peer.origin
  client = new FetchClient()
}
export async function operation(input) {
  // A string body is sent as it is (only objects are serialized), so the type is given here.
  const response = await client.postJSON(origin + input.path, input.body, options)
  if (response.status !== 201 || response.data === null) throw new Error(`status ${response.status}`)
  return response.data
}
