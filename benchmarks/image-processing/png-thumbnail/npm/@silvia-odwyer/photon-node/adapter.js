import { Buffer } from 'node:buffer'
import { PhotonImage, SamplingFilter, resize } from '@silvia-odwyer/photon-node'
// Untimed, once per fixture: the hex string becomes the file's bytes.
export const prepare = ({ png, width, height }) => ({ bytes: Buffer.from(png, 'hex'), width, height })
export const operation = ({ bytes, width, height }) => {
  const image = PhotonImage.new_from_byteslice(bytes)
  const small = resize(image, width, height, SamplingFilter.Lanczos3)
  const out = small.get_bytes()
  // The images live in the WebAssembly memory until freed.
  image.free()
  small.free()
  return out
}
