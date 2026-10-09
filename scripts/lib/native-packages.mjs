// Third-party packages in Python, Ruby and Go for operation tasks (synchronous
// and asynchronous) and client tasks:
// adapters under <task>/pypi/<name>/, <task>/rubygems/<name>/ and
// <task>/gomod/<name>/. An adapter names its package; this file resolves it
// to exact files, records them beside the adapter, installs them under
// .cache/native-packages/ and says how the harness's own runner finds them.
// See "Adapters for PyPI, RubyGems and Go modules" in benchmarks/README.md.
//
// The rules, the same for the three registries:
//
//   Age       A release is used only when the registry says it was published
//             at least seven days ago, the package's and every dependency's.
//             The newest such release is "the latest". This is checked when a
//             version is chosen, and again against the registry before
//             anything is downloaded for an install.
//   Pins      The version chosen for a package is written to versions.json
//             (pypi, rubygems, gomod), so every task uses the same one. The
//             exact files, with their SHA-256 and publication dates, are in
//             the adapter's folder: lock.json for PyPI and RubyGems, go.mod
//             and go.sum for Go. These are part of the adapter's fingerprint.
//   No code   Nothing of a package runs while it is installed, except where
//             said below.
//
// PyPI      Wheels only, never a source distribution (building one runs the
//           package's code). pip is given the exact files with their hashes
//           (--require-hashes --no-deps --only-binary=:all:) and unpacks
//           them. A wheel may hold compiled code (orjson's does): that is a
//           binary its authors built and published for this platform, checked
//           by its SHA-256, and unpacking it compiles and runs nothing. The
//           shared applications allow pure-Python wheels only, because both
//           CPython and PyPy import from their one folder; here each runtime
//           has its own set of files. PyPy is given pure-Python wheels only;
//           a package that has none is recorded as not available on PyPy.
//   RubyGems  Each .gem at its locked version, its age and SHA-256 checked
//           against the RubyGems API first, installed without resolving
//           anything (--ignore-dependencies). A precompiled gem for this
//           platform is preferred. A gem with a native extension and no
//           precompiled build is compiled by `gem install`, which runs the
//           gem's extconf.rb: the one exception to "no code", as for the
//           Rails application. The lock says which gems these are
//           (`"compiles": true`) and each result records them.
//   Go        go.mod requires the one module at its pinned version (and, after
//           `go mod tidy`, the modules it needs); go.sum holds the checksums.
//           Every module of the build list is checked against
//           proxy.golang.org before each build. The go command itself is
//           only ever given a proxy of this script's own (see goProxy), which
//           passes metadata through and refuses the source of any module
//           version less than seven days old: whatever the go command
//           decides to fetch, no younger source reaches the machine. The
//           build is `go build -mod=readonly` with GOTOOLCHAIN=local; no
//           `go generate`, and nothing else of the module is run.
//
// Parallel runs: an install folder is named by a hash of the exact files in
// it, built under a temporary name and renamed into place, so two runs that
// want the same set do not disturb each other and nothing is ever rewritten.
// Go's module and build caches are safe to share. versions.json is changed
// under its lock file (see npm.mjs).
import { execFile, execFileSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { goFamily, goPackageName } from './ecosystems.mjs'
import { pythonInstall, rubyInstall } from './install-size.mjs'
import { updateManifest } from './npm.mjs'
import { fromRoot, readJson } from './util.mjs'

const exec = promisify(execFile)
export const MIN_RELEASE_AGE_DAYS = 7
const MIN_AGE_MS = MIN_RELEASE_AGE_DAYS * 864e5
const CACHE = fromRoot('.cache/native-packages')

// The registries handled here, with the language and runtimes of each.
export const NATIVE_REGISTRIES = {
  pypi: { language: 'python', runtimes: ['cpython', 'pypy'] },
  rubygems: { language: 'ruby', runtimes: ['ruby', 'ruby-yjit'] },
  gomod: { language: 'go', runtimes: ['go'] },
}

const pythonName = (name) => name.toLowerCase().replace(/[-_.]+/g, '-')
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20)
const firstLine = (error) => String(error.stderr || error.message).trim().split('\n').filter(Boolean).at(-1)

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  return response.json()
}

// A helper script given a request on standard input, answering in JSON.
function ask(command, args, request, env) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, { env, maxBuffer: 64 << 20 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(String(stderr || error.message).trim().split('\n').filter(Boolean).at(-1)))
      try { resolve(JSON.parse(stdout)) } catch { reject(new Error(`unreadable answer from ${path.basename(args[0])}: ${stdout.slice(0, 200)}`)) }
    })
    child.stdin.end(JSON.stringify(request))
  })
}

// A folder built under a temporary name becomes `dir` in one step. When
// another run got there first, its folder (the same files) is kept.
async function publish(temporary, dir) {
  try {
    await rename(temporary, dir)
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    if (!existsSync(dir)) throw error
  }
}

async function writeAtomically(file, text) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(`${file}.${process.pid}`, text)
  await rename(`${file}.${process.pid}`, file)
}

const lockPath = (target) => path.join(target.dir, 'lock.json')
const ABOUT = 'Written by scripts/lib/native-packages.mjs the first time the adapter is run; not edited by hand. The exact files the adapter is installed with on each kind of machine it has been resolved for: every one at least seven days old when chosen, and checked again by SHA-256 and age before an install. Delete this file to resolve again (the versions in versions.json still hold).'
const writeLock = (target, lock) => writeAtomically(lockPath(target), JSON.stringify(lock, null, 2) + '\n')

// Pins of one registry in versions.json; `same` folds names that differ only in spelling.
async function pinsOf(registry, same = (name) => name) {
  const pins = (await readJson(fromRoot('versions.json'), {}))[registry] ?? {}
  return Object.fromEntries(Object.entries(pins).map(([name, version]) => [same(name), version]))
}
async function pin(registry, versions, same = (name) => name) {
  const held = await pinsOf(registry, same)
  if (Object.keys(versions).every((name) => held[same(name)])) return
  await updateManifest((manifest) => {
    const pins = (manifest[registry] ??= {})
    const known = new Set(Object.keys(pins).map(same))
    for (const [name, version] of Object.entries(versions)) if (!known.has(same(name))) pins[name] = version
    manifest[registry] = Object.fromEntries(Object.entries(pins).sort(([a], [b]) => a.localeCompare(b)))
  })
}

// The package an adapter is for and whatever else it asks for by name.
function wanted(target, meta, same = (name) => name) {
  const name = meta.package ?? target.name
  if (same(name) !== name) throw new Error(`name the folder (or adapter.json "package") "${same(name)}", the registry's spelling of "${name}"`)
  return [name, ...(meta.dependencies ?? []).map(same)]
}

// --- PyPI -------------------------------------------------------------------

// The PEP 508 marker values of an interpreter, asked of the interpreter itself.
const PYTHON_ENVIRONMENT = `import json,os,platform,sys
v=sys.implementation.version
iv='%d.%d.%d'%(v.major,v.minor,v.micro)+('' if v.releaselevel=='final' else v.releaselevel[0]+str(v.serial))
print(json.dumps({'implementation_name':sys.implementation.name,'implementation_version':iv,'os_name':os.name,'platform_machine':platform.machine(),'platform_release':platform.release(),'platform_system':platform.system(),'platform_version':platform.version(),'python_full_version':platform.python_version(),'platform_python_implementation':platform.python_implementation(),'python_version':'.'.join(platform.python_version_tuple()[:2]),'sys_platform':sys.platform}))`
const pythonEnvironments = new Map()
function pythonEnvironment(bin) {
  if (!pythonEnvironments.has(bin)) pythonEnvironments.set(bin, JSON.parse(execFileSync(bin, ['-c', PYTHON_ENVIRONMENT], { encoding: 'utf8' })))
  return pythonEnvironments.get(bin)
}
// A lock holds one set of files per kind of machine: wheels differ by
// interpreter, operating system and processor.
const machineKey = (runtime, version) => `${runtime}-${version}-${process.platform}-${process.arch}`
const pypiKey = (runtimeId, rt) => machineKey(runtimeId, pythonEnvironment(rt.bin).python_version)

async function lockPypi({ target, meta, config }) {
  const roots = wanted(target, meta, pythonName)
  let lock = await readJson(lockPath(target), null)
  let wrote = false
  for (const runtimeId of meta.runtimes) {
    const rt = config.runtimes[runtimeId]
    const key = pypiKey(runtimeId, rt)
    if (lock?.environments?.[key]) continue
    // The package's version is the one already settled: by this lock on
    // another machine or runtime, or by versions.json. Dependencies prefer
    // the versions other tasks use.
    const shared = await pinsOf('pypi', pythonName)
    const settled = Object.fromEntries(Object.values(lock?.environments ?? {}).flatMap((e) => (e.packages ?? []).map((p) => [p.name, p.version])))
    const pins = { ...shared, ...settled, ...(lock ? { [roots[0]]: lock.version } : {}) }
    const answer = await ask(config.runtimes.cpython.bin, [fromRoot('scripts/lib/pypi-resolve.py')], { roots, pins, environment: pythonEnvironment(rt.bin), pure: rt.engine !== 'cpython', minAgeDays: MIN_RELEASE_AGE_DAYS }, process.env)
    if (answer.packages) await pin('pypi', Object.fromEntries(answer.packages.map((p) => [p.name, p.version])), pythonName)
    // With no version settled yet there is nothing to say a runtime lacks.
    const version = lock?.version ?? answer.packages?.find((p) => p.name === roots[0]).version ?? null
    if (!version) continue
    lock = { about: ABOUT, registry: 'pypi', package: roots[0], version, environments: { ...lock?.environments, [key]: answer.packages ? { packages: answer.packages } : { unavailable: answer.unavailable } } }
    await writeLock(target, lock)
    wrote = true
  }
  return wrote
}

// The release must still be there, not yanked and old enough, and the locked
// file must be the wheel PyPI lists under that name.
async function checkPypiFile(entry) {
  const meta = await getJson(`https://pypi.org/pypi/${entry.name}/${entry.version}/json`)
  const cutoff = Date.now() - MIN_AGE_MS
  if (!meta.urls.length || meta.urls.some((file) => file.yanked || !(Date.parse(file.upload_time_iso_8601) <= cutoff))) throw new Error(`Ineligible PyPI release ${entry.name} ${entry.version}: yanked or less than seven days old`)
  const file = meta.urls.find((candidate) => candidate.filename === entry.file)
  if (!file || file.packagetype !== 'bdist_wheel' || !/^[0-9a-f]{64}$/.test(entry.sha256 ?? '') || file.digests.sha256 !== entry.sha256) throw new Error(`Wheel checksum failed: ${entry.file}`)
}

async function installPypi(packages, { cpython, pureFor }) {
  const dir = path.join(CACHE, 'pypi', digest(packages.map((p) => [p.name, p.version, p.sha256]).sort()))
  if (existsSync(dir)) return dir
  for (const entry of packages) await checkPypiFile(entry)
  const temporary = `${dir}.${process.pid}`
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })
  const requirements = path.join(temporary, 'requirements.txt')
  await writeFile(requirements, packages.map((p) => `${p.name}==${p.version} --hash=sha256:${p.sha256}\n`).join(''))
  // pip runs under CPython. For another interpreter it is told to take only
  // wheels that any Python 3 can use; for CPython it takes the best wheel for
  // itself, and the hash holds it to the file that was locked.
  const other = pureFor ? ['--implementation', 'py', '--python-version', pureFor, '--abi', 'none', '--platform', 'any'] : []
  try {
    await exec(cpython, ['-m', 'pip', '--isolated', 'install', '--disable-pip-version-check', '--no-cache-dir', '--index-url', 'https://pypi.org/simple', '--only-binary=:all:', '--no-deps', '--no-compile', '--require-hashes', ...other, '--target', temporary, '-r', requirements], { maxBuffer: 64 << 20 })
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw new Error(`pip: ${firstLine(error)}`)
  }
  await publish(temporary, dir)
  return dir
}

async function preparePypi({ target, meta, runtimeId, rt, config }) {
  const roots = wanted(target, meta, pythonName)
  const lock = await readJson(lockPath(target), null)
  const locked = lock?.environments?.[pypiKey(runtimeId, rt)]
  if (!locked) throw new Error('not resolved for this machine yet')
  if (locked.unavailable) return { version: lock.version, unavailable: locked.unavailable }
  const pure = rt.engine !== 'cpython'
  const dir = await installPypi(locked.packages, { cpython: config.runtimes.cpython.bin, pureFor: pure ? pythonEnvironment(rt.bin).python_version : null })
  const prebuilt = locked.packages.filter((p) => p.compiled).map((p) => p.name)
  return {
    dir,
    version: lock.version,
    dependencies: Object.fromEntries(locked.packages.filter((p) => p.name !== roots[0]).map((p) => [p.name, p.version])),
    install: { ...pythonInstall(dir, roots), ...(prebuilt.length ? { prebuilt } : {}) },
    // -B is among the runtime's arguments, so nothing is written to the shared folder.
    env: { PYTHONPATH: dir },
  }
}

// --- RubyGems ---------------------------------------------------------------

const rubies = new Map()
// The Ruby in use: its version, the folder of the gems it shipped with, and those gems.
function rubyInfo(bin) {
  if (!rubies.has(bin)) {
    const script = `require 'json'; own = File.join(RbConfig::CONFIG['rubylibprefix'], 'gems', RbConfig::CONFIG['ruby_version']); puts JSON.generate(version: RUBY_VERSION, rubyGems: own, shipped: Gem::Specification.select { |s| s.default_gem? || s.base_dir == own }.map { |s| "#{s.name} #{s.version}" })`
    rubies.set(bin, JSON.parse(execFileSync(bin, ['-e', script], { encoding: 'utf8', env: withoutGemPaths() })))
  }
  return rubies.get(bin)
}
function withoutGemPaths() {
  const { GEM_HOME, GEM_PATH, RUBYOPT, BUNDLE_GEMFILE, ...env } = process.env
  return env
}
const gemId = (gem) => `${gem.name}-${gem.version}${gem.platform ? `-${gem.platform}` : ''}`
const gemKey = (rt) => machineKey('ruby', rubyInfo(rt.bin).version)

async function lockGems({ target, meta, config }) {
  const roots = wanted(target, meta)
  const rt = config.runtimes[meta.runtimes[0]]
  const key = gemKey(rt)
  let lock = await readJson(lockPath(target), null)
  if (lock?.environments?.[key]) return false
  const settled = Object.fromEntries(Object.values(lock?.environments ?? {}).flatMap((e) => e.gems.map((g) => [g.name, g.version])))
  const pins = { ...await pinsOf('rubygems'), ...settled, ...(lock ? { [roots[0]]: lock.version } : {}) }
  const answer = await ask(rt.bin, [fromRoot('scripts/lib/gem-resolve.rb')], { roots, pins, minAgeDays: MIN_RELEASE_AGE_DAYS, downloads: path.join(CACHE, 'rubygems/downloads') }, withoutGemPaths())
  await pin('rubygems', Object.fromEntries(answer.gems.map((g) => [g.name, g.version])))
  lock = { about: ABOUT, registry: 'rubygems', package: roots[0], version: lock?.version ?? answer.gems.find((g) => g.name === roots[0]).version, environments: { ...lock?.environments, [key]: { gems: answer.gems, fromRuby: answer.fromRuby } } }
  await writeLock(target, lock)
  return true
}

async function installGems(locked, rt) {
  const ruby = rubyInfo(rt.bin)
  const dir = path.join(CACHE, 'rubygems', digest([ruby.version, ...locked.gems.map((g) => [gemId(g), g.sha256]).sort()]))
  for (const [name, version] of Object.entries(locked.fromRuby ?? {})) {
    if (!ruby.shipped.includes(`${name} ${version}`)) throw new Error(`the lock leaves ${name} ${version} to Ruby, which this Ruby does not ship: delete lock.json to resolve again`)
  }
  if (existsSync(dir)) return dir
  const downloads = path.join(CACHE, 'rubygems/downloads')
  await mkdir(downloads, { recursive: true })
  const cutoff = Date.now() - MIN_AGE_MS
  const files = []
  // Every gem is checked before the first is installed.
  for (const gem of locked.gems) {
    const meta = (await getJson(`https://rubygems.org/api/v1/versions/${gem.name}.json`)).find((v) => v.number === gem.version && v.platform === (gem.platform ?? 'ruby'))
    if (!meta || meta.yanked || !(Date.parse(meta.created_at) <= cutoff)) throw new Error(`Ineligible gem ${gemId(gem)}: yanked or less than seven days old`)
    if (!/^[0-9a-f]{64}$/.test(gem.sha256 ?? '') || meta.sha !== gem.sha256) throw new Error(`Gem checksum failed: ${gemId(gem)}`)
    const file = path.join(downloads, `${gemId(gem)}.gem`)
    const sha = (bytes) => createHash('sha256').update(bytes).digest('hex')
    if (!existsSync(file) || sha(await readFile(file)) !== gem.sha256) {
      const response = await fetch(`https://rubygems.org/downloads/${gemId(gem)}.gem`)
      if (!response.ok) throw new Error(`Could not download ${gemId(gem)}: ${response.status}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      if (sha(bytes) !== gem.sha256) throw new Error(`Gem checksum failed: ${gemId(gem)}`)
      await writeFile(`${file}.${process.pid}`, bytes)
      await rename(`${file}.${process.pid}`, file)
    }
    files.push(file)
  }
  const temporary = `${dir}.${process.pid}`
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })
  try {
    for (const file of files) {
      // A gem with a native extension is compiled here (see the top of this file).
      await exec(path.join(path.dirname(rt.bin), 'gem'), ['install', '--local', file, '--install-dir', temporary, '--ignore-dependencies', '--no-document'], { env: { ...withoutGemPaths(), GEM_HOME: temporary, GEM_PATH: temporary }, maxBuffer: 64 << 20 })
    }
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw new Error(`gem install: ${firstLine(error)}`)
  }
  await publish(temporary, dir)
  return dir
}

async function prepareGems({ target, meta, rt }) {
  const roots = wanted(target, meta)
  const lock = await readJson(lockPath(target), null)
  const locked = lock?.environments?.[gemKey(rt)]
  if (!locked) throw new Error('not resolved for this machine yet')
  const dir = await installGems(locked, rt)
  const built = locked.gems.filter((g) => g.compiles && !g.platform).map((g) => g.name)
  const prebuilt = locked.gems.filter((g) => g.platform).map((g) => g.name)
  return {
    dir,
    gems: locked.gems.map((gem) => path.join(dir, 'gems', gemId(gem))),
    version: lock.version,
    dependencies: Object.fromEntries([...locked.gems.filter((g) => g.name !== roots[0]).map((g) => [g.name, g.version]), ...Object.entries(locked.fromRuby ?? {})]),
    install: { ...rubyInstall(dir, roots), ...(built.length ? { built } : {}), ...(prebuilt.length ? { prebuilt } : {}) },
    // The installed gems, then the gems Ruby shipped with (its bundled gems);
    // not the gems that happen to be installed on the machine.
    env: { GEM_HOME: dir, GEM_PATH: `${dir}${path.delimiter}${rubyInfo(rt.bin).rubyGems}` },
  }
}

// --- Go modules -------------------------------------------------------------

// The module proxy the go command is given: proxy.golang.org seen through
// the release-age rule. .info and .mod files (metadata) are passed on as they
// are. A module's source (.zip) is passed on only when the proxy's own .info
// for that version says it was published at least seven days ago. The list of
// versions and @latest, which the go command resolves an import with no
// version (go mod tidy) from, hold only versions that old and that the pinned
// Go can build (the `go` line of their go.mod), so "latest" is the newest
// release old enough, as for npm and PyPI, and as pip passes over a release
// that needs a newer interpreter. /sumdb/ is not served, so
// the go command verifies checksums with sum.golang.org directly.
const UPSTREAM = 'https://proxy.golang.org'
const publishedAt = new Map()
const publishedTime = (base, version) => {
  const key = `${base}/@v/${version}`
  if (!publishedAt.has(key)) publishedAt.set(key, fetch(`${UPSTREAM}${key}.info`).then(async (r) => (r.ok ? Date.parse((await r.json()).Time) : NaN), () => NaN))
  return publishedAt.get(key)
}
const oldEnough = (time) => time <= Date.now() - MIN_AGE_MS
const needsGo = new Map()
const buildableWith = async (base, version, goVersion) => {
  const key = `${base}/@v/${version}`
  if (!needsGo.has(key)) needsGo.set(key, fetch(`${UPSTREAM}${key}.mod`).then(async (r) => (r.ok ? /^go\s+(\d+(?:\.\d+)*)/m.exec(await r.text())?.[1] ?? null : '999'), () => '999'))
  const needs = await needsGo.get(key)
  if (!needs) return true
  const a = needs.split('.').map(Number), b = goVersion.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0)
  return true
}
// One proxy per Go version, since what that Go can build is part of the answer.
const goProxyAddresses = new Map()
export function goProxy(goVersion) {
  if (!goProxyAddresses.has(goVersion)) goProxyAddresses.set(goVersion, new Promise((resolve, reject) => {
    const server = createServer(async (request, response) => {
      try {
        const source = /^(\/.+)\/@v\/(.+)\.zip$/.exec(request.url)
        const list = /^(\/.+)\/@v\/list$/.exec(request.url)
        const latest = /^(\/.+)\/@latest$/.exec(request.url)
        if (request.method !== 'GET' || request.url.startsWith('/sumdb/')) return response.writeHead(404).end('not served')
        if (source && !oldEnough(await publishedTime(source[1], source[2]))) return response.writeHead(403).end(`refused: ${request.url} is less than ${MIN_RELEASE_AGE_DAYS} days old`)
        if (list) {
          const upstream = await fetch(`${UPSTREAM}${request.url}`)
          if (!upstream.ok) return response.writeHead(upstream.status).end(await upstream.text())
          const versions = (await upstream.text()).split('\n').filter(Boolean)
          const kept = (await Promise.all(versions.map(async (v) => (oldEnough(await publishedTime(list[1], v)) && await buildableWith(list[1], v, goVersion) ? v : null)))).filter(Boolean)
          return response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }).end(kept.map((v) => `${v}\n`).join(''))
        }
        if (latest) {
          // The go command asks for @latest only when the list has no release;
          // a commit too new is then not there to be had.
          const upstream = await fetch(`${UPSTREAM}${request.url}`)
          const body = await upstream.text()
          if (upstream.ok && !oldEnough(Date.parse(JSON.parse(body).Time))) return response.writeHead(404).end(`not found: the latest version of ${latest[1].slice(1)} is less than ${MIN_RELEASE_AGE_DAYS} days old`)
          if (upstream.ok && !(await buildableWith(latest[1], JSON.parse(body).Version, goVersion))) return response.writeHead(404).end(`not found: the latest version of ${latest[1].slice(1)} needs a newer Go than ${goVersion}`)
          return response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/json' }).end(body)
        }
        const upstream = await fetch(`${UPSTREAM}${request.url}`)
        // The body is read whole before anything is sent, so a download that
        // breaks off is still answered as an error.
        const body = Buffer.from(await upstream.arrayBuffer())
        response.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream' })
        response.end(body)
      } catch (error) {
        if (response.headersSent) response.destroy()
        else response.writeHead(502).end(String(error.message))
      }
    })
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => { server.unref(); resolve(`http://127.0.0.1:${server.address().port}`) })
  }))
  return goProxyAddresses.get(goVersion)
}
const goEnv = async (rt) => ({ ...process.env, GOCACHE: fromRoot('.cache/go-build'), GOPATH: fromRoot('.cache/go-path'), GOMODCACHE: fromRoot('.cache/go-mod'), GOTOOLCHAIN: 'local', GOFLAGS: '', GOPROXY: await goProxy(rt.version), GONOSUMDB: '', GONOSUMCHECK: '', GONOPROXY: '', GOPRIVATE: '', GOINSECURE: '', GOSUMDB: 'sum.golang.org', GOWORK: 'off' })
const goRun = async (rt, args, cwd) => exec(rt.bin, args, { cwd, env: await goEnv(rt), maxBuffer: 64 << 20 }).then((r) => r.stdout, (error) => { throw new Error(`go ${args[0]}: ${firstLine(error)}`) })
const goEscape = (modulePath) => modulePath.replace(/[A-Z]/g, (c) => `!${c.toLowerCase()}`)
const goBuildList = async (rt, dir, mode) => JSON.parse(`[${(await goRun(rt, ['list', '-m', '-json', `-mod=${mode}`, 'all'], dir)).trim().replace(/}\s*{/g, '},{')}]`)

async function goPublished(modulePath, version) {
  const info = await getJson(`https://proxy.golang.org/${goEscape(modulePath)}/@v/${version}.info`)
  return Date.parse(info.Time)
}

// Every module of a build list must be a published release at least seven days old.
async function checkGoAges(modules) {
  const cutoff = Date.now() - MIN_AGE_MS
  await Promise.all(modules.filter((module) => !module.Main).map(async (module) => {
    if (!module.Version || module.Replace) throw new Error(`Ineligible module ${module.Path}: not a published release`)
    if (!((await goPublished(module.Path, module.Version)) <= cutoff)) throw new Error(`Ineligible module ${module.Path}@${module.Version}: less than seven days old`)
  }))
}

// Whether this Go can build a module version: the `go` line of its go.mod
// (metadata, from the proxy) must not ask for a newer Go. As pip and RubyGems
// pass over a release that needs a newer interpreter.
async function goCanBuild(modulePath, version, goVersion) {
  const response = await fetch(`https://proxy.golang.org/${goEscape(modulePath)}/@v/${version}.mod`)
  if (!response.ok) return false
  const needs = /^go\s+(\d+(?:\.\d+)*)/m.exec(await response.text())?.[1]
  if (!needs) return true
  const a = needs.split('.').map(Number), b = goVersion.split('.').map(Number)
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0)
  return true
}

// The newest release of a module that is at least seven days old and that
// this Go can build.
async function newestGoVersion(modulePath, goVersion) {
  const cutoff = Date.now() - MIN_AGE_MS
  const response = await fetch(`https://proxy.golang.org/${goEscape(modulePath)}/@v/list`)
  if (!response.ok) throw new Error(`proxy.golang.org has no module ${modulePath} (${response.status})`)
  const numbers = (version) => version.slice(1).split('+')[0].split('.').map(Number)
  const releases = (await response.text()).split('\n').filter((v) => /^v\d+\.\d+\.\d+(\+incompatible)?$/.test(v))
    .sort((a, b) => { const x = numbers(a), y = numbers(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2] })
  // As go get @latest does: a +incompatible tag (a major version above 1 from
  // before the module had a go.mod) is passed over once the newest regular
  // release has a go.mod of its own. The proxy's @latest applies that rule.
  const latest = await getJson(`https://proxy.golang.org/${goEscape(modulePath)}/@latest`).catch(() => null)
  if (latest && !latest.Version.endsWith('+incompatible') && releases.some((v) => !v.endsWith('+incompatible'))) releases.splice(0, Infinity, ...releases.filter((v) => !v.endsWith('+incompatible')))
  for (const version of releases) if ((await goPublished(modulePath, version)) <= cutoff && await goCanBuild(modulePath, version, goVersion)) return version
  // A module with no tagged release is known to the proxy by its latest commit.
  if (!releases.length) {
    const latest = await getJson(`https://proxy.golang.org/${goEscape(modulePath)}/@latest`)
    if (Date.parse(latest.Time) <= cutoff && await goCanBuild(modulePath, latest.Version, goVersion)) return latest.Version
    // When that commit is too new, the newest commits from before the cutoff,
    // which the proxy lists nowhere: for a GitHub repository, asked of GitHub,
    // then resolved to versions by the proxy (a commit hash is a valid query).
    const repo = /^github\.com\/([^/]+)\/([^/]+)/.exec(modulePath)
    if (repo) {
      const commits = await fetch(`https://api.github.com/repos/${repo[1]}/${repo[2]}/commits?until=${new Date(cutoff).toISOString()}&per_page=10`, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'package-efficiency-bench' } }).then((r) => (r.ok ? r.json() : []), () => [])
      for (const { sha } of commits) {
        const info = await getJson(`https://proxy.golang.org/${goEscape(modulePath)}/@v/${sha}.info`).catch(() => null)
        if (info && Date.parse(info.Time) <= cutoff && await goCanBuild(modulePath, info.Version, goVersion)) return info.Version
      }
    }
  }
  throw new Error(`no release of ${modulePath} is at least seven days old and builds with Go ${goVersion}`)
}

function goModule(target, meta) {
  if (!meta.module) throw new Error('adapter.json needs "module": the path of the Go module')
  const name = meta.package ?? target.name
  if (name !== goPackageName(meta.module)) throw new Error(`name the folder (or adapter.json "package") "${goPackageName(meta.module)}" for the module ${meta.module}`)
  return { name, module: meta.module }
}

// Writes go.mod and go.sum beside the adapter, once.
async function lockGo({ target, meta, config }) {
  const { name, module } = goModule(target, meta)
  const rt = config.toolchains.go
  const mod = path.join(target.dir, 'go.mod'), sum = path.join(target.dir, 'go.sum')
  if (existsSync(mod) && existsSync(sum)) return false
  const fresh = !existsSync(mod)
  if (fresh) {
    const version = (await pinsOf('gomod'))[name] ?? await newestGoVersion(module, rt.version)
    await writeAtomically(mod, `module bench/${name}\n\ngo ${rt.version.split('.').slice(0, 2).join('.')}.0\n\nrequire ${module} ${version}\n`)
  }
  try {
    // The build list from the modules' go.mod files alone, checked before any
    // source is asked for; then the sources and their checksums (go mod tidy,
    // which also adds whatever else adapter.go imports: that passes the same
    // proxy, and the whole build list is checked again).
    await checkGoAges(await goBuildList(rt, target.dir, 'mod'))
    await goRun(rt, ['mod', 'tidy'], target.dir)
    const modules = await goBuildList(rt, target.dir, 'readonly')
    await checkGoAges(modules)
    const version = modules.find((m) => m.Path === module)?.Version
    if (!version) throw new Error(`adapter.go does not import a package of ${module}`)
    if (!existsSync(sum)) await writeFile(sum, '')
    await pin('gomod', { [name]: version })
  } catch (error) {
    // Left as it was found: with no go.mod, the next run starts over.
    if (fresh) await rm(mod, { force: true })
    await rm(sum, { force: true })
    throw error
  }
  return true
}

// The Go runners a module adapter can be built with: the operation runner
// (synchronous and asynchronous operation tasks, which call prepare on every
// fixture) and the client runner (client tasks, no prepare).
export const GO_RUNNERS = {
  operation: { file: 'harness/go/runner.go', prepare: true },
  client: { file: 'harness/go/client-runner.go', prepare: false },
}

// The kinds of task that take PyPI, RubyGems and Go module adapters, and the
// Go runner each builds them with. Servers and applications have installs of
// their own (scripts/lib/native-http.mjs, scripts/lib/apps.mjs).
export const PACKAGE_TASK_KINDS = { 'sync-operation': 'operation', 'async-operation': 'operation', client: 'client' }

async function prepareGo({ taskId, target, meta, rt, runner: kind = 'operation' }) {
  const { module } = goModule(target, meta)
  const chosen = GO_RUNNERS[kind]
  if (!chosen) throw new Error(`no Go runner "${kind}"`)
  const work = fromRoot('.cache/work', taskId, 'gomod', target.name)
  const binary = path.join(work, 'runner')
  const record = path.join(work, 'build.json')
  const runner = await readFile(fromRoot(chosen.file), 'utf8')
  const adapter = await readFile(path.join(target.dir, 'adapter.go'), 'utf8')
  const files = ['go.mod', 'go.sum']
  const stamp = digest([rt.version, runner, adapter, ...files.map((file) => readFileSync(path.join(target.dir, file), 'utf8'))])
  let built = existsSync(record) && existsSync(binary) ? await readJson(record) : null
  if (built?.stamp !== stamp) {
    await checkGoAges(await goBuildList(rt, target.dir, 'readonly'))
    await rm(work, { recursive: true, force: true })
    await mkdir(work, { recursive: true })
    for (const file of files) await copyFile(path.join(target.dir, file), path.join(work, file))
    await writeFile(path.join(work, 'runner.go'), runner)
    await writeFile(path.join(work, 'adapter.go'), adapter)
    // The operation runner calls prepare on every fixture; most adapters have none.
    if (chosen.prepare) await writeFile(path.join(work, 'prepare.go'), /^func prepare\(/m.test(adapter) ? 'package main\n' : 'package main\nfunc prepare(v any) any { return v }\n')
    await goRun(rt, ['build', '-mod=readonly', '-o', binary, '.'], work)
    // The modules linked into the program, as the binary itself lists them.
    const linked = Object.fromEntries([...(await goRun(rt, ['version', '-m', binary], work)).matchAll(/^\tdep\t(\S+)\t(\S+)/gm)].map(([, dep, version]) => [dep, version]))
    const { [module]: version = null, ...dependencies } = linked
    if (!version) throw new Error(`the program does not link ${module}`)
    built = { stamp, version, dependencies }
    await writeFile(record, JSON.stringify(built, null, 2) + '\n')
  }
  return { command: binary, workdir: work, version: built.version, dependencies: built.dependencies, env: {} }
}

// --- What measure.mjs calls ---------------------------------------------------

// adapter.json with the registry's language and runtimes filled in.
export function nativeMeta(target, meta) {
  const registry = NATIVE_REGISTRIES[target.ecosystem]
  return { ...meta, language: meta.language ?? registry.language, runtimes: meta.runtimes ?? registry.runtimes }
}

// Resolves the adapter's package for this machine if that has not been done,
// writing the lock beside the adapter. True when something was written.
export async function lockNativePackage({ target, meta, config }) {
  const context = { target, meta: nativeMeta(target, meta), config }
  return target.ecosystem === 'pypi' ? lockPypi(context) : target.ecosystem === 'rubygems' ? lockGems(context) : lockGo(context)
}

// Installs (or builds) the locked package for one runtime. Gives the version
// and dependencies to record, the install size, and how to run the adapter:
// `env` for the interpreter (Python, Ruby) or `command`, the built program
// (Go). `unavailable` instead, with the reason, where the package cannot run
// on the runtime.
// `runner` chooses the Go runner the program is built with (GO_RUNNERS):
// 'operation' by default, 'client' for a client task.
export async function prepareNativePackage({ taskId, target, meta, runtimeId, rt, config, runner }) {
  const context = { taskId, target, meta: nativeMeta(target, meta), runtimeId, rt, config, runner }
  return target.ecosystem === 'pypi' ? preparePypi(context) : target.ecosystem === 'rubygems' ? prepareGems(context) : prepareGo(context)
}

export { goFamily, goPackageName }
