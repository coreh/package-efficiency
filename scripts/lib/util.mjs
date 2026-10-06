import { execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const fromRoot = (...parts) => path.join(ROOT, ...parts)

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (err) {
    if (err.code === 'ENOENT' && fallback !== undefined) return fallback
    throw err
  }
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value, null, 2) + '\n')
}

export function median(values) {
  const sorted = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(v)).sort((a, b) => a - b)
  if (sorted.length === 0) return null
  const mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

const versionOf = (bin, args = ['--version']) =>
  /\d+\.\d+\.\d+/.exec(execFileSync(bin, args, { encoding: 'utf8' }))?.[0] ?? null

// runtimes.json with every `bin` resolved to an absolute path and its actual
// version filled in. Versions are pinned by toolchains/package.json, not here.
export async function loadConfig() {
  const config = await readJson(fromRoot('runtimes.json'))
  const resolve = (bin) => {
    if (path.isAbsolute(bin)) return bin
    if (bin === 'node') return process.execPath
    if (!bin.includes('/')) return bin
    const [match] = globSync(bin, { cwd: ROOT })
    if (!match) throw new Error(`no binary matches ${bin}; run npm install in toolchains/`)
    return fromRoot(match)
  }
  for (const group of ['runtimes', 'compilers', 'toolchains']) {
    for (const entry of Object.values(config[group])) {
      entry.bin = resolve(entry.bin)
      entry.version = versionOf(entry.bin, entry.versionArgs)
      if (entry.expectedVersion && entry.version !== entry.expectedVersion) throw new Error(`${entry.title}: expected ${entry.expectedVersion}, got ${entry.version}`)
    }
  }
  return config
}

export const machine = () => ({
  os: `${os.platform()} ${os.release()}`,
  arch: os.arch(),
  cpu: os.cpus()[0]?.model ?? 'unknown',
  cores: os.cpus().length,
})
