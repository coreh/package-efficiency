import { execFile } from 'node:child_process'
import path from 'node:path'
import {writeFile} from 'node:fs/promises'
import { promisify } from 'node:util'
import { fromRoot, readJson, writeJson } from './util.mjs'

const exec = promisify(execFile)

// Packages under test are installed in their own directories, where the
// repo's .npmrc does not apply, so the safety settings are passed explicitly:
// versions younger than MIN_RELEASE_AGE_DAYS are skipped (including
// transitive dependencies) and install scripts never run.
export const MIN_RELEASE_AGE_DAYS = 7
const NPM_INSTALL = ['install', `--min-release-age=${MIN_RELEASE_AGE_DAYS}`, '--ignore-scripts', '--no-audit', '--no-fund', '--silent']

// versions.json is the edition's lock: one version per package, shared by
// every task and by the type measurements.
const MANIFEST = fromRoot('versions.json')
const manifest = await readJson(MANIFEST, { npm: {} })

export const installedVersion = async (dir, name) =>
  (await readJson(path.join(dir, 'node_modules', name, 'package.json'), {})).version ?? null

export const pinnedVersion = (name) => manifest.npm[name] ?? null

// Installs `names` into `dir` at their pinned versions. A package seen for the
// first time resolves to its newest eligible version and is pinned from then on.
// `overrides` installs other versions (for measuring a package's history)
// without changing what is pinned.
export async function installPinned(dir, names, overrides = {}) {
  if (names.length === 0) return {}
  const jsrNames = names.filter(name => manifest.jsr?.[name])
  const jsrVersions = {}
  for (const name of jsrNames) Object.assign(jsrVersions, await installJsr(dir,name))
  names = names.filter(name => !jsrNames.includes(name))
  if (!names.length) return jsrVersions
  const wanted = (name) => overrides[name] ?? manifest.npm[name]
  const specs = names.map(name => wanted(name) ? `${name}@${wanted(name)}` : name)
  await exec('npm', [...NPM_INSTALL, ...specs], { cwd: dir })
  const versions = { ...jsrVersions }
  for (const name of names) {
    versions[name] = name in overrides ? await installedVersion(dir, name) : (manifest.npm[name] ??= await installedVersion(dir, name))
  }
  manifest.npm = Object.fromEntries(Object.entries(manifest.npm).sort(([a], [b]) => a.localeCompare(b)))
  await writeJson(MANIFEST, manifest)
  return versions
}

// Canonical JSR names are npm aliases only for transport. Registry identity
// remains JSR in the edition manifest, results and UI.
export async function installJsr(dir, name) {
  const [,scope,pkg] = /^@([^/]+)\/(.+)$/.exec(name) ?? []
  if (!scope) throw new Error(`Invalid JSR name: ${name}`)
  const response = await fetch(`https://api.jsr.io/scopes/${scope}/packages/${pkg}/versions`)
  if (!response.ok) throw new Error(`JSR metadata: ${response.status}`)
  const metadata = await response.json()
  const cutoff = Date.now() - MIN_RELEASE_AGE_DAYS * 86400000
  const eligible = metadata.items.filter(v => !v.yanked && /^\d+\.\d+\.\d+$/.test(v.version) && Date.parse(v.createdAt) < cutoff)
    .sort((a,b) => b.version.localeCompare(a.version,'en',{numeric:true}))
  const version = manifest.jsr?.[name] ?? eligible[0]?.version
  if (!eligible.some(v => v.version === version)) throw new Error(`No eligible JSR version for ${name}`)
  await writeFile(path.join(dir,'.npmrc'), '@jsr:registry=https://npm.jsr.io\n')
  await exec('npm',[...NPM_INSTALL,`${name}@npm:@jsr/${scope}__${pkg}@${version}`],{cwd:dir})
  manifest.jsr ??= {};manifest.jsr[name] = version
  await writeJson(MANIFEST,manifest)
  return {[name]:version}
}
