// Installs the locked Python packages into a private folder under .cache/ and
// says how to start the project. Nothing is built: Django has no build step,
// and the project runs in place from this folder (the runtimes are started
// with -B, so no bytecode is written here).
//
// The install follows scripts/setup-http-servers.mjs: every package and
// version is listed in lock.json (the frameworks and all they require), each
// release is checked against the PyPI JSON API to be at least seven days old
// and not yanked, and pip is given the exact list with --no-deps and
// --only-binary. Both CPython and PyPy import from the one folder, so every
// wheel must also be pure Python. Each wheel's SHA-256 is in lock.json: it
// must be the one PyPI lists, and pip refuses a download that does not have
// it (--require-hashes).
//
// The one project has several forms, chosen by the adapter record's
// `variant`: a settings module (DJANGO_SETTINGS_MODULE) and the kind of
// server adapter.py starts (BENCH_SERVER). Every form runs from this folder
// and from the one install.
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const MIN_AGE_MS = 7 * 864e5
const pythonName = (name) => name.toLowerCase().replace(/[-_.]+/g, '-')

// The forms of the project. With no variant it is the generated project as
// Django's documentation deploys it: config.settings behind a WSGI server.
const VARIANTS = {
  '': { settings: 'config.settings', server: 'wsgi' },
  // The same project and synchronous views behind an ASGI server.
  asgi: { settings: 'config.settings', server: 'asgi' },
  // Coroutine views (shop.views_async) behind an ASGI server.
  async: { settings: 'config.settings_async', server: 'asgi' },
  // The apps, middleware, context processors and database the shop does not use taken out.
  minimal: { settings: 'config.settings_minimal', server: 'wsgi' },
}

// name -> { version, info } of what is installed in `dir`.
function installed(dir) {
  const found = new Map()
  if (!existsSync(dir)) return found
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.dist-info')) continue
    const metadata = path.join(dir, entry, 'METADATA')
    if (!existsSync(metadata)) continue
    const text = readFileSync(metadata, 'utf8')
    const name = /^Name:\s*(.+)$/m.exec(text)?.[1].trim()
    const version = /^Version:\s*(.+)$/m.exec(text)?.[1].trim()
    if (name && version) found.set(pythonName(name), { version, info: path.join(dir, entry) })
  }
  return found
}

// The release must have files, none yanked, all at least seven days old, and
// its only wheel must be a pure-Python one with the locked checksum.
async function checkRelease({ name, version, sha256 }) {
  const response = await fetch(`https://pypi.org/pypi/${name}/${version}/json`)
  if (!response.ok) throw new Error(`PyPI has no ${name} ${version} (${response.status})`)
  const meta = await response.json()
  const cutoff = Date.now() - MIN_AGE_MS
  if (!meta.urls.length || meta.urls.some((file) => file.yanked || !(Date.parse(file.upload_time_iso_8601) <= cutoff))) throw new Error(`Ineligible PyPI release ${name} ${version}: yanked or less than seven days old`)
  const wheels = meta.urls.filter((file) => file.packagetype === 'bdist_wheel')
  if (!wheels.length || !wheels.every((file) => file.filename.endsWith('-none-any.whl'))) throw new Error(`${name} ${version} is not a pure-Python wheel`)
  if (wheels.length !== 1 || !/^[0-9a-f]{64}$/.test(sha256 ?? '') || wheels[0].digests.sha256 !== sha256) throw new Error(`Wheel checksum failed: ${name} ${version}`)
}

// Bytes of the files each package's RECORD lists (bytecode is not installed).
function installSize(dir, dists) {
  let bytes = 0
  for (const { info } of dists) {
    for (const line of readFileSync(path.join(info, 'RECORD'), 'utf8').split('\n')) {
      const file = path.join(dir, line.split(',')[0])
      if (line && !file.endsWith('.pyc') && existsSync(file)) bytes += lstatSync(file).size
    }
  }
  return { kind: 'install', bytes, packages: dists.length }
}

export async function prepare({ root, runtime, variant, helpers }) {
  const form = VARIANTS[variant ?? '']
  if (!form) throw new Error(`Django has no variant "${variant}"`)
  const lock = JSON.parse(await readFile(path.join(here, 'lock.json'), 'utf8')).packages
  const packages = helpers.fromRoot('.cache/web-frameworks/python/django')
  // What was installed, by checksum: a changed lock is installed again.
  const stamp = path.join(packages, 'installed-lock.json')
  const wanted = JSON.stringify(lock.map(({ name, version, sha256 }) => [name, version, sha256]))
  const complete = () => { const have = installed(packages); return existsSync(stamp) && readFileSync(stamp, 'utf8') === wanted && lock.every(({ name, version }) => have.get(pythonName(name))?.version === version) }
  if (!complete()) {
    for (const entry of lock) await checkRelease(entry)
    await mkdir(packages, { recursive: true })
    const requirements = path.join(packages, 'requirements.txt')
    await writeFile(requirements, lock.map(({ name, version, sha256 }) => `${name}==${version} --hash=sha256:${sha256}\n`).join(''))
    // pip runs under CPython; what it installs is pure Python and serves PyPy too.
    const python = JSON.parse(await readFile(path.join(root, 'runtimes.json'), 'utf8')).runtimes.cpython.bin
    execFileSync(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-cache-dir', '--upgrade', '--only-binary=:all:', '--no-deps', '--no-compile', '--require-hashes', '--target', packages, '-r', requirements], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] })
    await writeFile(stamp, wanted)
    if (!complete()) throw new Error('pip did not install every locked package')
  }
  const have = installed(packages)
  // Both servers are in the one folder; a form is recorded with the one it loads.
  const used = lock.filter((entry) => entry.for === 'all' || entry.for === form.server)
  return {
    version: lock.find(({ name }) => name === 'django').version,
    dependencies: Object.fromEntries(used.filter(({ name }) => name !== 'django').map(({ name, version }) => [name, version])),
    install: installSize(packages, used.map(({ name }) => have.get(pythonName(name)))),
    launch: {
      command: runtime.bin,
      args: [...runtime.args, helpers.pythonRunner, path.join(here, 'adapter.py'), packages],
      cwd: here,
      // The project is found on PYTHONPATH, as it is when a server is started in its folder.
      env: { DJANGO_SETTINGS_MODULE: form.settings, BENCH_SERVER: form.server, PYTHONPATH: here, PYTHONDONTWRITEBYTECODE: '1' },
      phases: ['boot', 'loaded', 'ready'],
    },
    base: { command: runtime.bin, args: [...runtime.args, helpers.pythonRunner, '-'], cwd: root },
  }
}
