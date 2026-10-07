let origin
export function connect(peer) {
  origin = peer.origin
}
export async function operation(input) {
  const response = await fetch(origin + input.path)
  if (!response.ok) throw new Error(`status ${response.status}`)
  return response.json()
}
