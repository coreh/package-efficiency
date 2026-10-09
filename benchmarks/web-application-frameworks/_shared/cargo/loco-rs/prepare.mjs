// Builds this crate in release mode and says how to start it: see
// ../prepare-cargo.mjs, which the Rust applications share. Loco reads its
// views (assets/views) and configuration (config/production.yaml) from the
// folder of the application, so that is where the server is started.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prepareCargo } from '../prepare-cargo.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

export const prepare = async ({ root, runtime }) => {
  const prepared = prepareCargo({ root, runtime, crate: 'web-application-frameworks-loco-rs', framework: 'loco-rs' })
  return { ...prepared, launch: { ...prepared.launch, cwd: here, env: { LOCO_CONFIG_FOLDER: path.join(here, 'config') } } }
}
