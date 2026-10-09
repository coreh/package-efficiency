// Installs the gems of gems.lock.json into a private gem folder, copies the
// application to a folder under .cache/, and says how to start it: inside the
// shared Ruby runner, which serves the Rack app that adapter.rb returns with
// one Puma server in its own process.
//
// The installation follows scripts/setup-http-servers.mjs, as the Rails
// application's prepare.mjs does: each gem at its pinned version, at least
// seven days old by the RubyGems API, its checksum verified against both the
// lock and the API, installed without resolving dependencies (the lock is the
// whole set) and without documentation. There is no Gemfile: the runner points
// RubyGems at the gem folder and the application requires what it uses.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const MIN_AGE_MS = 7 * 864e5

// The names RubyGems gives the platforms a precompiled gem is locked for.
const PLATFORMS = { 'darwin-arm64': 'arm64-darwin', 'darwin-x64': 'x86_64-darwin', 'linux-arm64': 'aarch64-linux-gnu', 'linux-x64': 'x86_64-linux-gnu' }

const idOf = (gem) => `${gem.name}-${gem.version}${gem.platform ? `-${gem.platform}` : ''}`

function bytesUnder(target) {
  const stat = lstatSync(target)
  if (!stat.isDirectory()) return stat.size
  let bytes = 0
  for (const entry of readdirSync(target)) bytes += bytesUnder(path.join(target, entry))
  return bytes
}

// The gems of the lock that this machine installs: one entry per name.
function lockedGems(lock) {
  const platform = PLATFORMS[`${process.platform}-${process.arch}`]
  const gems = lock.gems.filter((gem) => !gem.platform || gem.platform === platform)
  for (const name of new Set(lock.gems.map((gem) => gem.name))) {
    if (!gems.some((gem) => gem.name === name)) throw new Error(`${name} is not locked for this platform`)
  }
  return gems
}

async function install(gems, gemDir, runtime, stamp, wanted) {
  const downloads = path.join(path.dirname(gemDir), 'downloads')
  await mkdir(gemDir, { recursive: true })
  await mkdir(downloads, { recursive: true })
  const gemCommand = path.join(path.dirname(runtime.bin), 'gem')
  const cutoff = Date.now() - MIN_AGE_MS
  for (const gem of gems) {
    if (existsSync(path.join(gemDir, 'specifications', `${idOf(gem)}.gemspec`))) continue
    const versions = await fetch(`https://rubygems.org/api/v1/versions/${gem.name}.json`).then((r) => r.json())
    const meta = versions.find((v) => v.number === gem.version && v.platform === (gem.platform ?? 'ruby'))
    if (!meta || meta.yanked || !(Date.parse(meta.created_at) <= cutoff)) throw new Error(`Ineligible gem ${idOf(gem)}: not at least seven days old`)
    const bytes = Buffer.from(await fetch(`https://rubygems.org/downloads/${idOf(gem)}.gem`).then((r) => {
      if (!r.ok) throw new Error(`Could not download ${idOf(gem)}: ${r.status}`)
      return r.arrayBuffer()
    }))
    const sha = createHash('sha256').update(bytes).digest('hex')
    if (sha !== gem.sha256 || sha !== meta.sha) throw new Error(`Gem checksum failed: ${idOf(gem)}`)
    const file = path.join(downloads, `${idOf(gem)}.gem`)
    await writeFile(file, bytes)
    // The output goes to standard error: standard output is not ours to write.
    execFileSync(gemCommand, ['install', '--local', file, '--install-dir', gemDir, '--ignore-dependencies', '--no-document'], { stdio: ['ignore', 2, 2], env: { ...process.env, GEM_HOME: gemDir, GEM_PATH: gemDir } })
  }
  await writeFile(stamp, wanted)
}

const NOT_APP = new Set(['prepare.mjs', 'gems.lock.json'])

function filesUnder(target, found = []) {
  if (!lstatSync(target).isDirectory()) return found.push(target), found
  for (const entry of readdirSync(target).sort()) filesUnder(path.join(target, entry), found)
  return found
}

// Copies the application into `buildDir`. Skipped when the source and the gems
// are those of the copy that is there.
function build({ buildDir, wanted }) {
  const hash = createHash('sha256').update(wanted)
  for (const file of filesUnder(here).filter((file) => !NOT_APP.has(path.relative(here, file)))) hash.update(path.relative(here, file)).update(readFileSync(file))
  const fingerprint = hash.digest('hex')
  const stamp = path.join(buildDir, '.built')
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === fingerprint) return
  rmSync(buildDir, { recursive: true, force: true })
  cpSync(here, buildDir, { recursive: true, filter: (source) => source === here || !NOT_APP.has(path.relative(here, source).split(path.sep)[0]) })
  writeFileSync(stamp, fingerprint)
}

export async function prepare({ root, runtime, helpers }) {
  const lock = JSON.parse(readFileSync(path.join(here, 'gems.lock.json'), 'utf8'))
  const gems = lockedGems(lock)
  const home = helpers.fromRoot('.cache/web-frameworks/ruby/padrino')
  const gemDir = path.join(home, 'gems')

  // Installed once: the stamp records the lock and the Ruby it was built for.
  const stamp = path.join(home, 'installed.json')
  const wanted = JSON.stringify({ ruby: runtime.version ?? null, gems: gems.map((gem) => [idOf(gem), gem.sha256]) })
  const done = existsSync(stamp) && readFileSync(stamp, 'utf8') === wanted && gems.every((gem) => existsSync(path.join(gemDir, 'specifications', `${idOf(gem)}.gemspec`)))
  if (!done) await install(gems, gemDir, runtime, stamp, wanted)

  const buildDir = helpers.fromRoot('.cache/work/web-application-frameworks/_shared/rubygems/padrino')
  await mkdir(path.dirname(buildDir), { recursive: true })
  build({ buildDir, wanted })

  let bytes = 0
  for (const gem of gems) {
    bytes += bytesUnder(path.join(gemDir, 'gems', idOf(gem))) + bytesUnder(path.join(gemDir, 'specifications', `${idOf(gem)}.gemspec`))
    const extensions = path.join(gemDir, 'extensions')
    if (existsSync(extensions)) for (const built of filesUnder(extensions).filter((file) => file.split(path.sep).includes(idOf(gem)))) bytes += lstatSync(built).size
  }

  const version = gems.find((gem) => gem.name === 'padrino').version
  return {
    version,
    dependencies: Object.fromEntries(gems.filter((gem) => gem.name !== 'padrino').map((gem) => [gem.name, gem.version])),
    install: { kind: 'install', bytes, packages: gems.length },
    launch: {
      command: runtime.bin,
      args: [...runtime.args, helpers.rubyRunner, path.join(buildDir, 'adapter.rb'), gemDir],
      cwd: buildDir,
      env: {
        RACK_ENV: 'production',
      },
      phases: ['boot', 'loaded', 'ready'],
    },
    base: { command: runtime.bin, args: [...runtime.args, helpers.rubyRunner, '-'], cwd: root },
  }
}
