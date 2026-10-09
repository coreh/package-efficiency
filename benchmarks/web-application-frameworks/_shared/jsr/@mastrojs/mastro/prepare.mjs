// Installs Mastro (from JSR, through its npm bridge) in a work folder and starts
// its file-based handler inside the shared JavaScript runner. Mastro has no
// build step for pages that are rendered per request.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SOURCES = ['adapter.js', 'lib', 'routes']

export async function prepare({ root, runtime, variant, helpers }) {
  if (variant) throw new Error(`mastro has no variant named ${variant}`)
  const workdir = helpers.fromRoot('.cache/work/web-application-frameworks/_shared/jsr/@mastrojs/mastro')
  mkdirSync(workdir, { recursive: true })
  for (const name of SOURCES) rmSync(path.join(workdir, name), { recursive: true, force: true })
  for (const name of SOURCES) cpSync(path.join(here, name), path.join(workdir, name), { recursive: true })
  if (!existsSync(path.join(workdir, 'package.json'))) writeFileSync(path.join(workdir, 'package.json'), '{"private":true,"type":"module"}\n')
  copyFileSync(helpers.jsRunner, path.join(workdir, 'runner.mjs'))

  // JSR packages are installed through the bridge at the seven-day-old release.
  const { installJsr } = await import(pathToFileURL(path.join(root, 'scripts/lib/npm.mjs')).href)
  const { '@mastrojs/mastro': version } = await installJsr(workdir, '@mastrojs/mastro')
  const dependencies = await helpers.installPinned(workdir, ['@remix-run/node-fetch-server'])

  return {
    version,
    dependencies,
    install: helpers.nodeInstall(workdir),
    launch: { command: runtime.bin, args: [...runtime.args, 'runner.mjs', 'adapter.js'], cwd: workdir, env: { NODE_ENV: 'production' }, phases: ['boot', 'loaded', 'ready'] },
  }
}
