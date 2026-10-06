// Install the pinned PyPy archive locally; other native runtimes are checked
// against runtimes.json by loadConfig(). No global installation is changed.
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { fromRoot, readJson } from './lib/util.mjs'
const version = '8.0.0', filename = 'pypy3.12-v8.0.0-macos_arm64.tar.gz'
if (process.platform !== 'darwin' || process.arch !== 'arm64') throw new Error('This pinned native setup targets macOS arm64; select matching toolchains for another platform.')
const dir = fromRoot('.cache/toolchains')
const manifestFile = fromRoot('toolchains/native.json')
const manifest = await readJson(manifestFile)
if (!existsSync(fromRoot('.cache/toolchains/pypy3.12-v8.0.0-macos_arm64/bin/pypy3'))) {
  const releaseResponse = await fetch('https://downloads.python.org/pypy/versions.json')
  if (!releaseResponse.ok) throw new Error('Cannot verify PyPy release age')
  const releases = await releaseResponse.json()
  const release = releases.find(r => r.pypy_version === version && r.python_version === '3.12.14')
  if (!release || Date.now() - Date.parse(release.date) < 7*86400000) throw new Error('PyPy release must be at least seven days old')
  const response = await fetch(manifest.pypy.url)
  if (!response.ok) throw new Error(`Download failed: ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (hash !== manifest.pypy.sha256) throw new Error('PyPy archive SHA-256 mismatch')
  await mkdir(dir, {recursive:true})
  await writeFile(fromRoot('.cache/toolchains',filename), bytes)
  execFileSync('tar',['-xzf',fromRoot('.cache/toolchains',filename),'-C',dir],{stdio:'inherit'})
}
console.log('Pinned PyPy is available; native Go, Python and Ruby paths/versions are recorded in runtimes.json.')
