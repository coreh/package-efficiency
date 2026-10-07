// Builds this crate in release mode and says how to start it: see
// ../prepare-cargo.mjs, which the Rust applications share.
//
// Dioxus's server serves the files of a `public` folder beside its program
// (where `dx` puts the client bundle and assets) and stops at start if the
// folder is not there. This is built with plain cargo, which makes no such
// folder, so an empty one is made here.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { prepareCargo } from '../prepare-cargo.mjs'

export async function prepare({ root, runtime }) {
  const prepared = prepareCargo({ root, runtime, crate: 'web-application-frameworks-dioxus', framework: 'dioxus' })
  mkdirSync(path.join(path.dirname(prepared.launch.command), 'public'), { recursive: true })
  return prepared
}
