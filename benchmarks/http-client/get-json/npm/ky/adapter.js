import ky from 'ky'
let origin
export function connect(peer) {
  origin = peer.origin
}
export function operation(input) {
  return ky.get(origin + input.path).json()
}
