// Nothing to install or build: the adapter is run in place by the shared runner.
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export async function prepare({ runtime, helpers }) {
  return {
    version: null,
    dependencies: {},
    launch: { command: runtime.bin, args: [...runtime.args, helpers.jsRunner, path.join(here, 'adapter.js')], cwd: here, phases: ['boot', 'loaded', 'ready'] },
  }
}
