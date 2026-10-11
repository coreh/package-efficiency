// Install the pinned native toolchains for this kind of machine under
// .cache/toolchains/ (see toolchains/native.json): PyPy on macOS; on Linux
// also Rust, Go, CPython and CRuby, which macOS takes from Homebrew and
// rustup. Each archive is used only when it is at least seven days old and
// matches its SHA-256. Nothing global is changed; runtimes.json names the
// binaries and checks their versions. Safe to run again.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { PLATFORM, fromRoot, readJson } from './lib/util.mjs'

const MIN_AGE_MS = 7 * 86400000
const manifest = await readJson(fromRoot('toolchains/native.json'))
const archives = manifest.archives[PLATFORM]
if (!archives) throw new Error(`toolchains/native.json pins no toolchains for ${PLATFORM}`)
const toolchains = fromRoot('.cache/toolchains')
await mkdir(toolchains, { recursive: true })

async function download(name, pin) {
  if (!(Date.now() - Date.parse(pin.released) >= MIN_AGE_MS)) throw new Error(`${name}: released ${pin.released}, less than seven days ago`)
  console.error(`${name}: downloading ${pin.url}`)
  const response = await fetch(pin.url)
  if (!response.ok) throw new Error(`${name}: download failed: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (createHash('sha256').update(bytes).digest('hex') !== pin.sha256) throw new Error(`${name}: SHA-256 mismatch`)
  const file = path.join(toolchains, `${pin.dir}.download`)
  await writeFile(file, bytes)
  return file
}

// Unpacked into a temporary folder and renamed into place, so a broken run
// leaves nothing that looks installed.
async function unpack(name, pin, install) {
  const dir = path.join(toolchains, pin.dir)
  if (existsSync(dir)) return dir
  const file = await download(name, pin)
  const work = `${dir}.${process.pid}`
  await rm(work, { recursive: true, force: true })
  await mkdir(work, { recursive: true })
  execFileSync('tar', ['-xf', file, '-C', work, '--strip-components=1'], { stdio: 'inherit' })
  await install(work, dir)
  await rm(file, { force: true })
  return dir
}

const env = { ...process.env }
for (const [name, pin] of Object.entries(archives)) {
  const dir = await unpack(name, pin, async (work, dir) => {
    if (pin.installer) {
      // Rust's own installer copies rustc, cargo and the standard library.
      execFileSync('sh', [path.join(work, 'install.sh'), `--prefix=${dir}`, '--components=rustc,cargo,rust-std-' + path.basename(pin.url).replace(/^rust-[\d.]+-|\.tar\.xz$/g, ''), '--disable-ldconfig'], { stdio: 'inherit' })
      await rm(work, { recursive: true, force: true })
    } else await rename(work, dir)
  })
  if (name === 'rust') env.PATH = `${path.join(dir, 'bin')}:${env.PATH}`
}

// CRuby on Linux, from its source release: no build of it is published.
// --enable-yjit builds YJIT with the Rust above.
if (process.platform === 'linux') {
  const pin = manifest.rubySource
  await unpack('ruby', pin, async (work, dir) => {
    const run = (command, args) => execFileSync(command, args, { cwd: work, env, stdio: 'inherit' })
    run('./configure', [`--prefix=${dir}`, '--enable-yjit', '--disable-install-doc', '--enable-shared'])
    run('make', [`-j${os.availableParallelism()}`])
    run('make', ['install'])
    await rm(work, { recursive: true, force: true })
  })
}
console.log(`Pinned native toolchains for ${PLATFORM} are in .cache/toolchains; runtimes.json names them and checks their versions.`)
