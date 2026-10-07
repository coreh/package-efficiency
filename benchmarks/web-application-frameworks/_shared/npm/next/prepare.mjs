// Installs Next.js into a work folder, builds the application for production
// there (once per change of sources or versions), and says how to start it:
// the shared runner, with adapter.js starting Next's server in that process.
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const here = path.dirname(fileURLToPath(import.meta.url))

// The application: everything here but this file.
const SOURCES = ['package.json', 'next.config.mjs', 'adapter.js', 'app', 'lib']

// The tuned forms of the application. next.config.mjs reads the name from
// BENCH_VARIANT, when it is built and when it is served, and each form is
// built into a folder of its own, so that one does not overwrite another.
const VARIANTS = { 'no-compress': { distDir: '.next-no-compress' } }

async function hashOf(entries, versions, lockfile) {
  // The lockfile stands for every package the named ones bring with them.
  const hash = createHash('sha256').update(JSON.stringify(versions)).update(await readFile(lockfile))
  const add = async (file) => hash.update(path.relative(here, file)).update(await readFile(file))
  for (const entry of entries) {
    const full = path.join(here, entry)
    const inside = await readdir(full, { recursive: true, withFileTypes: true }).catch(() => null)
    if (!inside) await add(full)
    else for (const file of inside.filter((f) => f.isFile()).map((f) => path.join(f.parentPath, f.name)).sort()) await add(file)
  }
  return hash.digest('hex')
}

export async function prepare({ runtime, variant, helpers }) {
  if (variant && !VARIANTS[variant]) throw new Error(`next has no variant named ${variant}`)
  const distDir = variant ? VARIANTS[variant].distDir : '.next'
  // Always set, so that a value in the caller's environment cannot choose the form.
  const variantEnv = { BENCH_VARIANT: variant ?? '' }
  const workdir = helpers.fromRoot('.cache/work/web-application-frameworks/_shared/npm/next')
  await mkdir(workdir, { recursive: true })
  for (const entry of SOURCES) {
    if (entry !== 'package.json') await rm(path.join(workdir, entry), { recursive: true, force: true })
    await cp(path.join(here, entry), path.join(workdir, entry), { recursive: true })
  }
  await copyFile(helpers.jsRunner, path.join(workdir, 'runner.mjs'))

  const { next: version, ...dependencies } = await helpers.installPinned(workdir, ['next', 'react', 'react-dom'])

  const env = { ...process.env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', ...variantEnv }
  const hash = await hashOf(SOURCES, { next: version, ...dependencies, variant }, path.join(workdir, 'package-lock.json'))
  const stamp = path.join(workdir, variant ? `.build-hash-${variant}` : '.build-hash')
  const built = existsSync(path.join(workdir, distDir, 'BUILD_ID')) && (await readFile(stamp, 'utf8').catch(() => '')) === hash
  if (!built) {
    await rm(stamp, { force: true })
    await rm(path.join(workdir, distDir), { recursive: true, force: true })
    // The build is a tool run once; it runs on Node whatever runtime serves it.
    await exec(process.execPath, [path.join(workdir, 'node_modules/next/dist/bin/next'), 'build'], { cwd: workdir, env, maxBuffer: 64 * 1024 * 1024 })
    await writeFile(stamp, hash)
  }

  return {
    version,
    dependencies,
    install: await helpers.nodeInstall(workdir),
    launch: {
      command: runtime.bin,
      args: [...runtime.args, 'runner.mjs', 'adapter.js'],
      cwd: workdir,
      env: { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', ...variantEnv },
      phases: ['boot', 'loaded', 'ready'],
    },
  }
}
