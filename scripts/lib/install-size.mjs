// What a package costs on disk once installed, recorded beside its results
// and shown ungraded (the kinds differ too much between languages to rank):
//   npm and JSR  the package and everything it pulls in, as installed for the
//                benchmark: bytes of all files, and how many packages that is
//   Python       the package and the installed packages it requires, from the
//                folder it is installed in: the files each one's RECORD lists
//   Ruby         the gem and the gems it requires at run time: each one's
//                folder, compiled extension and specification
//   Rust and Go  what the package adds to the compiled program: the size of
//                the adapter's binary less the size of the empty baseline binary
// Built-ins have none: they come with the runtime.
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// Bytes of every file under `dir`, links not followed.
function bytesUnder(dir) {
  let bytes = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) bytes += bytesUnder(file)
    else if (entry.isFile()) bytes += lstatSync(file).size
  }
  return bytes
}

// The node_modules of an adapter's work folder. npm's own bookkeeping
// (.package-lock.json, .bin) is not part of what was installed.
export function nodeInstall(workdir) {
  const modules = path.join(workdir, 'node_modules')
  if (!existsSync(modules)) return null
  let bytes = 0
  for (const entry of readdirSync(modules, { withFileTypes: true })) {
    if (entry.name === '.bin' || entry.name === '.package-lock.json') continue
    const file = path.join(modules, entry.name)
    bytes += entry.isDirectory() ? bytesUnder(file) : entry.isFile() ? lstatSync(file).size : 0
  }
  const lock = path.join(modules, '.package-lock.json')
  const packages = existsSync(lock) ? Object.keys(JSON.parse(readFileSync(lock, 'utf8')).packages ?? {}).filter((key) => key.startsWith('node_modules/')).length : null
  return { kind: 'install', bytes, packages }
}

// A Rust or Go adapter's binary against the baseline binary built the same way.
export function binaryInstall(binary, baseline) {
  if (!existsSync(binary) || !existsSync(baseline)) return null
  return { kind: 'binary', bytes: Math.max(0, statSync(binary).size - statSync(baseline).size) }
}

// Every package reached from `names` through `requires`, by its key.
function closure(names, requires) {
  const seen = new Set()
  const visit = (name) => { if (!seen.has(name) && requires.has(name)) { seen.add(name); for (const next of requires.get(name)) visit(next) } }
  for (const name of names) visit(name)
  return seen
}

// Python packages installed side by side in one folder (pip --target). A
// package's files are those its RECORD lists; what it needs is its
// Requires-Dist lines, leaving out optional extras and whatever is not
// installed (a requirement for another Python version or platform).
const pythonName = (name) => name.toLowerCase().replace(/[-_.]+/g, '-')
export function pythonInstall(dir, names) {
  if (!existsSync(dir)) return null
  const dists = new Map()
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith('.dist-info')) continue
    const info = path.join(dir, entry)
    const requires = readFileSync(path.join(info, 'METADATA'), 'utf8').split('\n')
      .filter((line) => line.startsWith('Requires-Dist:') && !/extra\s*==/.test(line))
      .map((line) => pythonName(/^Requires-Dist:\s*([A-Za-z0-9._-]+)/.exec(line)[1]))
    dists.set(pythonName(entry.slice(0, entry.lastIndexOf('-', entry.length - '.dist-info'.length - 1))), { info, requires })
  }
  const installed = closure(names.map(pythonName), new Map([...dists].map(([name, d]) => [name, d.requires])))
  if (!names.every((name) => installed.has(pythonName(name)))) return null
  let bytes = 0
  for (const name of installed) {
    const record = path.join(dists.get(name).info, 'RECORD')
    for (const line of readFileSync(record, 'utf8').split('\n')) {
      const file = path.join(dir, line.split(',')[0])
      // Compiled bytecode is made on first use, not installed.
      if (line && !file.endsWith('.pyc') && existsSync(file)) bytes += lstatSync(file).size
    }
  }
  return { kind: 'install', bytes, packages: installed.size }
}

// Gems installed into one folder (gem install --install-dir).
export function rubyInstall(dir, names) {
  const specs = path.join(dir, 'specifications')
  if (!existsSync(specs)) return null
  const gems = new Map()
  for (const entry of readdirSync(specs)) {
    if (!entry.endsWith('.gemspec')) continue
    const id = entry.slice(0, -'.gemspec'.length)
    const requires = [...readFileSync(path.join(specs, entry), 'utf8').matchAll(/add_runtime_dependency\(%q<([^>]+)>/g)].map((m) => m[1])
    // The name is read from the specification: a precompiled gem's file name
    // ends in its platform (nokogiri-1.19.4-arm64-darwin), not in its version.
    const text = readFileSync(path.join(specs, entry), 'utf8')
    gems.set(/^\s*s\.name = "([^"]+)"/m.exec(text)?.[1] ?? id.slice(0, id.lastIndexOf('-')), { id, requires })
  }
  const installed = closure(names, new Map([...gems].map(([name, g]) => [name, g.requires])))
  if (!names.every((name) => installed.has(name))) return null
  let bytes = 0
  for (const name of installed) {
    const { id } = gems.get(name)
    bytes += bytesUnder(path.join(dir, 'gems', id)) + lstatSync(path.join(specs, `${id}.gemspec`)).size
    const extensions = path.join(dir, 'extensions')
    if (existsSync(extensions)) for (const platform of readdirSync(extensions)) for (const abi of readdirSync(path.join(extensions, platform))) {
      const built = path.join(extensions, platform, abi, id)
      if (existsSync(built)) bytes += bytesUnder(built)
    }
  }
  return { kind: 'install', bytes, packages: installed.size }
}
