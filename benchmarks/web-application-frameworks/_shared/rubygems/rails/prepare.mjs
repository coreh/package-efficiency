// Installs the gems of gems.lock.json into a private gem folder, builds the
// application for production in a folder under .cache/, and says how to start
// it: inside the shared Ruby runner, which serves the Rack app that adapter.rb
// returns with one Puma server in its own process.
//
// The installation follows scripts/setup-http-servers.mjs: each gem at its
// pinned version, at least seven days old by the RubyGems API, its checksum
// verified against both the lock and the API, installed without resolving
// dependencies (the lock is the whole set) and without documentation. Bundler
// then only loads what is installed: Gemfile.lock names the same versions, and
// the application is started with BUNDLE_FROZEN, so nothing is resolved or
// fetched when it boots.
//
// The build is a copy of this folder's application (everything but this file,
// the lock, build.rb and variants/), so that what Rails writes (public/assets,
// tmp/, log/, storage/) stays out of the source. A tuned variant is the same
// source with variants/<name>/remove.json taken out and variants/<name>/overlay/
// copied over it: an overlay holds only the files that differ.
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

// What is not the application: this file, the lock, the build step, the variants.
const NOT_APP = new Set(['prepare.mjs', 'gems.lock.json', 'build.rb', 'variants'])
// A fixed key: this benchmark application has no secrets and no credentials
// file. SECRET_KEY_BASE is where a generated application reads it in production.
const SECRET_KEY_BASE = 'c0ffee5e8d1f4a7b9c2e6d3a0b1f4e7d9c8b5a2f6e3d0c7b4a1f8e5d2c9b6a3f0e7d4c1b8a5f2e9d6c3b0a7f4e1d8c5b2a9f6e3d0c7b4a1f8e5d2c9b6a3f0e7d4c'

function filesUnder(target, found = []) {
  if (!lstatSync(target).isDirectory()) return found.push(target), found
  for (const entry of readdirSync(target).sort()) filesUnder(path.join(target, entry), found)
  return found
}

// The names and versions Gemfile.lock gives Bundler: the gems one form of the
// application is installed with.
function bundled(lockfile) {
  const specs = new Map()
  for (const line of readFileSync(lockfile, 'utf8').split('\n')) {
    const spec = /^ {4}(\S+) \(([^)]+)\)$/.exec(line)
    if (spec) specs.set(spec[1], spec[2].replace(/-(?:arm64|x86_64|aarch64)-.+$/, ''))
  }
  return specs
}

// Copies the application into `build`, as the variant, and builds it for
// production. Skipped when the source, the variant and the gems are those of
// the build that is there.
function build({ buildDir, variant, variantDir, gemDir, runtime, wanted }) {
  const sources = filesUnder(here).filter((file) => !file.startsWith(path.join(here, 'variants') + path.sep) || (variant && file.startsWith(variantDir + path.sep)))
  const hash = createHash('sha256').update(wanted).update(variant ?? '')
  for (const file of sources) hash.update(path.relative(here, file)).update(readFileSync(file))
  const fingerprint = hash.digest('hex')
  const stamp = path.join(buildDir, '.built')
  if (existsSync(stamp) && readFileSync(stamp, 'utf8') === fingerprint) return
  rmSync(buildDir, { recursive: true, force: true })
  cpSync(here, buildDir, { recursive: true, filter: (source) => source === here || !NOT_APP.has(path.relative(here, source).split(path.sep)[0]) })
  if (variant) {
    const remove = path.join(variantDir, 'remove.json')
    if (existsSync(remove)) for (const entry of JSON.parse(readFileSync(remove, 'utf8'))) rmSync(path.join(buildDir, entry), { recursive: true, force: true })
    const overlay = path.join(variantDir, 'overlay')
    if (existsSync(overlay)) cpSync(overlay, buildDir, { recursive: true })
  }
  // The output goes to standard error: standard output is not ours to write.
  execFileSync(runtime.bin, [path.join(here, 'build.rb'), gemDir], {
    cwd: buildDir,
    stdio: ['ignore', 2, 2],
    env: { ...process.env, RAILS_ENV: 'production', BUNDLE_GEMFILE: path.join(buildDir, 'Gemfile'), BUNDLE_FROZEN: 'true', BUNDLE_IGNORE_CONFIG: '1', SECRET_KEY_BASE_DUMMY: '1', RAILS_LOG_LEVEL: 'warn' },
  })
  writeFileSync(stamp, fingerprint)
}

export async function prepare({ root, runtime, variant, helpers }) {
  const lock = JSON.parse(readFileSync(path.join(here, 'gems.lock.json'), 'utf8'))
  const gems = lockedGems(lock)
  const variantDir = variant ? path.join(here, 'variants', variant) : null
  if (variant && !(/^[a-z0-9-]+$/.test(variant) && existsSync(variantDir))) throw new Error(`The Rails application has no variant "${variant}"`)
  const home = helpers.fromRoot('.cache/web-frameworks/ruby/rails')
  const gemDir = path.join(home, 'gems')

  // Installed once: the stamp records the lock and the Ruby it was built for.
  const stamp = path.join(home, 'installed.json')
  const wanted = JSON.stringify({ ruby: runtime.version ?? null, gems: gems.map((gem) => [idOf(gem), gem.sha256]) })
  const done = existsSync(stamp) && readFileSync(stamp, 'utf8') === wanted && gems.every((gem) => existsSync(path.join(gemDir, 'specifications', `${idOf(gem)}.gemspec`)))
  if (!done) await install(gems, gemDir, runtime, stamp, wanted)

  const buildDir = helpers.fromRoot('.cache/work/web-application-frameworks/_shared/rubygems/rails', variant ?? 'default')
  await mkdir(path.dirname(buildDir), { recursive: true })
  build({ buildDir, variant, variantDir, gemDir, runtime, wanted })

  // What this form of the application is installed with: the gems of its
  // Gemfile.lock, each of them in gems.lock.json at that version or part of Ruby.
  const used = []
  for (const [name, version] of bundled(path.join(buildDir, 'Gemfile.lock'))) {
    const gem = gems.find((entry) => entry.name === name)
    if (gem ? gem.version !== version : lock.fromRuby[name] !== version) throw new Error(`Gemfile.lock has ${name} ${version}, which gems.lock.json does not`)
    if (gem) used.push(gem)
  }
  let bytes = 0
  for (const gem of used) {
    bytes += bytesUnder(path.join(gemDir, 'gems', idOf(gem))) + bytesUnder(path.join(gemDir, 'specifications', `${idOf(gem)}.gemspec`))
    const extensions = path.join(gemDir, 'extensions')
    if (existsSync(extensions)) for (const built of filesUnder(extensions).filter((file) => file.split(path.sep).includes(idOf(gem)))) bytes += lstatSync(built).size
  }

  const version = used.find((gem) => gem.name === 'rails').version
  return {
    version,
    dependencies: Object.fromEntries(used.filter((gem) => gem.name !== 'rails').map((gem) => [gem.name, gem.version])),
    install: { kind: 'install', bytes, packages: used.length },
    launch: {
      command: runtime.bin,
      args: [...runtime.args, helpers.rubyRunner, path.join(buildDir, 'adapter.rb'), gemDir],
      cwd: buildDir,
      env: {
        RAILS_ENV: 'production',
        BUNDLE_GEMFILE: path.join(buildDir, 'Gemfile'),
        BUNDLE_FROZEN: 'true',
        BUNDLE_IGNORE_CONFIG: '1',
        SECRET_KEY_BASE,
        // No request logging: the generated config/environments/production.rb reads this.
        RAILS_LOG_LEVEL: 'warn',
        // The thread count of the generated config/puma.rb, which the runner does not evaluate.
        BENCH_THREADS: '3',
      },
      phases: ['boot', 'loaded', 'ready'],
    },
    base: { command: runtime.bin, args: [...runtime.args, helpers.rubyRunner, '-'], cwd: root },
  }
}
