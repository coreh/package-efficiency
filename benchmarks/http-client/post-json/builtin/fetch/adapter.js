let origin
export function connect(peer) {
  origin = peer.origin
}
const headers = { 'content-type': 'application/json' }
export async function operation(input) {
  const response = await fetch(origin + input.path, { method: 'POST', headers, body: input.body })
  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}
