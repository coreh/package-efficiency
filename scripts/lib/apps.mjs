// Applications shared by several tasks: one built server per framework, in
// benchmarks/<category>/_shared/<registry>/<name>/, with a prepare.mjs that
// installs it, builds it and says how to start it. See
// benchmarks/web-application-frameworks/README.md.
import { globSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { installPinned } from './npm.mjs'
import { nodeInstall } from './install-size.mjs'
import { ROOT, fromRoot, readJson } from './util.mjs'

// What every prepare.mjs is handed.
export const appHelpers = {
  installPinned,
  nodeInstall,
  fromRoot,
  jsRunner: fromRoot('harness/js/runner.mjs'),
  pythonRunner: fromRoot('harness/python/http-runner.py'),
  rubyRunner: fromRoot('harness/ruby/http-runner.rb'),
}

// Installs and builds the application in `appDir` for one runtime, and
// returns how to start it. `variant` is the adapter record's `variant`: the
// name of a tuned form of the same application, or null for the framework's
// defaults.
export async function prepareApp(appDir, runtimeId, runtime, variant = null) {
  const { prepare } = await import(pathToFileURL(path.join(appDir, 'prepare.mjs')).href)
  return prepare({ root: ROOT, runtimeId, runtime, variant, helpers: appHelpers })
}

// Every shared application and variant with the runtimes its tasks run it
// on, from the adapter records that point at it.
export async function sharedApps() {
  const apps = new Map()
  for (const file of globSync('benchmarks/*/*/**/adapter.json', { cwd: ROOT, exclude: (name) => name === 'node_modules' || name === '_shared' })) {
    const meta = await readJson(fromRoot(file))
    if (!meta.app) continue
    const dir = path.resolve(fromRoot(path.dirname(file)), meta.app)
    const key = `${dir}\n${meta.variant ?? ''}`
    if (!apps.has(key)) apps.set(key, { dir, variant: meta.variant ?? null, runtimes: new Set() })
    for (const id of meta.runtimes ?? []) apps.get(key).runtimes.add(id)
  }
  return [...apps.values()].map(({ dir, variant, runtimes }) => ({ dir, variant, name: path.relative(fromRoot('benchmarks'), dir) + (variant ? ` (${variant})` : ''), runtimes: [...runtimes] }))
}
