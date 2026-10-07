// Builds this crate in release mode and says how to start it: see
// ../prepare-cargo.mjs, which the Rust applications share.
import { prepareCargo } from '../prepare-cargo.mjs'

export const prepare = async ({ root, runtime }) => prepareCargo({ root, runtime, crate: 'web-application-frameworks-hyper', framework: 'hyper' })
