// Installs Expo Router in a work folder, builds the application for production
// once (again only when the sources or the installed versions change) and
// starts the built server build (dist/server) with expo-server's Node http adapter inside the shared JavaScript runner.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SOURCES = ['package.json', 'app.json', 'metro.config.js', 'adapter.mjs', 'app', 'lib']
const PACKAGES = ['expo', 'expo-router', 'expo-server', 'expo-constants', 'expo-linking', '@expo/metro-runtime', 'react', 'react-dom', 'react-native', 'react-native-web', 'react-native-screens', 'react-native-safe-area-context']

function hashInto(hash, file) {
  const names = readdirSafe(file)
  if (names) for (const name of names.sort()) hashInto(hash, path.join(file, name))
  else hash.update(path.relative(here, file)).update(readFileSync(file))
}
const readdirSafe = (file) => {
  try {
    return readdirSync(file)
  } catch {
    return null
  }
}

export async function prepare({ runtime, variant, helpers }) {
  if (variant) throw new Error(`expo has no variant named ${variant}`)
  const workdir = helpers.fromRoot('.cache/work/web-application-frameworks/_shared/npm/expo')
  mkdirSync(workdir, { recursive: true })
  for (const name of ['app', 'lib']) rmSync(path.join(workdir, name), { recursive: true, force: true })
  for (const name of SOURCES) cpSync(path.join(here, name), path.join(workdir, name), { recursive: true })
  const versions = await helpers.installPinned(workdir, PACKAGES)
  copyFileSync(helpers.jsRunner, path.join(workdir, 'runner.mjs'))

  const hash = createHash('sha256').update(JSON.stringify(versions)).update(readFileSync(path.join(workdir, 'package-lock.json')))
  for (const name of SOURCES) hashInto(hash, path.join(here, name))
  const digest = hash.digest('hex')
  const stamp = path.join(workdir, '.build-hash')
  const built = existsSync(path.join(workdir, 'dist/server/_expo/routes.json')) && existsSync(stamp) && readFileSync(stamp, 'utf8') === digest
  if (!built) {
    rmSync(stamp, { force: true })
    rmSync(path.join(workdir, 'dist'), { recursive: true, force: true })
    // The build is a tool run once; it runs on Node whatever runtime serves it.
    execFileSync(process.execPath, [path.join(workdir, 'node_modules/expo/bin/cli'), 'export', '--platform', 'web'], { cwd: workdir, env: { ...process.env, NODE_ENV: 'production', EXPO_NO_TELEMETRY: '1', CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'] })
    if (!existsSync(path.join(workdir, 'dist/server/_expo/routes.json'))) throw new Error('the build did not write dist/server/_expo/routes.json')
    writeFileSync(stamp, digest)
  }

  const { expo: version, ...dependencies } = versions
  return {
    version,
    dependencies,
    install: helpers.nodeInstall(workdir),
    launch: { command: runtime.bin, args: [...runtime.args, 'runner.mjs', 'adapter.mjs'], cwd: workdir, env: { NODE_ENV: 'production' }, phases: ['boot', 'loaded', 'ready'] },
  }
}
