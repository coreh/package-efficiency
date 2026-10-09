// Type-check cost of gems, the counterpart of scripts/measure-types.mjs, with
// two checkers side by side as the npm check has tsc and tsgo:
//   rbs     how much the CPU time and peak memory of `rbs validate` grow when
//           the gem's RBS signatures (and its dependencies') are loaded
//   sorbet  the same for Sorbet (`srb tc`'s binary), only for gems that have
//           real Sorbet types
// Writes data/rubygems/types.json. Each entry holds both under `checks`; its
// `status` and `added` are those of the graded checker (--graded=rbs, the
// default, or --graded=sorbet). About half of the most used gems have RBS and
// very few have Sorbet types, which is why RBS grades.
//
// Usage: node scripts/sweep-types/rubygems.mjs <gem>... | --top=N
//        [--force] [--retry-failed] [--runs=11] [--keep] [--out=file]
//        [--graded=rbs|sorbet] [--std=exclude|include] [--scan] [--source]
// --top=N takes the N most used of data/rubygems/packages.json and everything
// in data/rubygems/picked.json. A run can be stopped and started again: the
// results file is written after every gem, gems already in it are skipped
// (--retry-failed tries the ones that are not `ok` again, --force everything),
// and Ctrl-C finishes the gem in hand.
// --scan only classifies (which gems each checker accepts), without timing.
// --source adds, to a Sorbet result, what Sorbet costs over the source alone.
//
// RBS
// ---
// Generated program: none is needed. `rbs validate` loads a set of signature
// directories and libraries and checks them: every type name resolves, type
// applications have the right arity, definitions are consistent.
//
// Where a gem's signatures come from (`typesFrom`), first that exists:
//   bundled              the gem's own sig/ folder
//   gem_rbs_collection/V ruby/gem_rbs_collection, the DefinitelyTyped of RBS:
//                        the newest version directory not newer than the gem
//   rbs-stdlib           signatures shipped with rbs itself for default and
//                        bundled gems (json, logger, ...), loaded with -r
// Only `bundled` is the gem's own; the other two are marked
// `communityTypes: true`.
// Dependency signatures are added the same way for the whole runtime
// dependency closure of the gemspec and for the names in sig/manifest.yaml:
// rbs's own library if it has one (so nothing is declared twice), else the
// dependency gem's own sig/, else the collection. A dependency with no
// signatures anywhere is left out; if the gem's signatures mention its types
// the validation fails and the gem is `check-failed`.
//
// Command, one fresh process per run, in an empty directory:
//   rbs [-r <library>]... -I <signature dir>... validate
// Baseline: the same with one empty signature directory (core only). Process
// CPU (user + system) and peak RSS, medians of the runs. The checker is the
// rbs that ships with the Ruby in use.
// What is subtracted: by default a second probe, as the Go sweep does it. The
// libraries rbs ships signatures for are Ruby's standard library (default and
// bundled gems), and a gem that depends on them, by its gemspec or its
// manifest.yaml, makes rbs load and validate them: that is the standard
// library's cost, not the gem's. The probe is the same command with only
// those libraries and the baseline's empty directory,
//   rbs -r <library>... -I <empty dir> validate
// with no signature of the gem, of a dependency gem or of the collection,
// measured with the same number of runs; gems with the same libraries share
// one measurement during a run (`standardLibraries` lists them). The gem's
// own library is never in the probe: for a gem that is itself one of rbs's
// libraries (json, logger) it is the thing measured.
// Figure (`added`): the gem's medians minus the probe's, so the gem and its
// dependency gems, not the standard library they use. `wholeTree` in the rbs
// check is the figure over the empty baseline (what `added` was before the
// standard library was taken out), `standardLibrary` the probe's over the
// same baseline; with --std=include `added` is the whole tree.
//
// Classification: ok (rbs validate exits 0), untyped (no RBS from any of the
// three sources), check-failed (rbs validate reports errors).
//
// Sorbet
// ------
// Only for a gem that ships RBI in rbi/, or whose source is written for Sorbet
// (at least half its files `# typed: true` or stricter, with sig blocks).
// Community annotations (Shopify/rbi-central) do not count: they are not the
// gem's own types and conflict with the source more often than not.
// Generated program: entry.rb, `# typed: true` and `require "<gem>"`.
// Command: sorbet --no-config --no-error-sections entry.rb [<gem>/rbi] <gem>/lib
// The source is passed with the RBI because shipped RBI declares signatures
// for classes it leaves the source to define. Baseline: the entry alone.
// Classification: ok (no error, or errors only in typed: false source, which
// are constants of gems that are not there), untyped, check-failed.
// No standard-library probe here: Sorbet's signatures of core and of the
// standard library are its payload, compiled into the binary and loaded whole
// by every run, the baseline's too, whatever the program requires. The
// baseline already takes all of it out, and no dependency gem is passed.
//
// A gem with no release at least 7 days old, or whose download fails its
// checksum, is install-failed.
//
// Safety: nothing is installed. A gem is downloaded only if that release was
// published at least 7 days ago (the listed version if old enough, else the
// highest stable one that is), its SHA-256 is compared with the registry's,
// and it is unpacked with tar: no extconf.rb, Rakefile or gem code runs and
// native extensions are never built. The gemspec is read with RubyGems' own
// safe loader. Dependency gems go through the same gate and only their sig/
// is unpacked. The community repositories are git clones checked out at their
// newest commit that is at least 7 days old.
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { raisePriority } from '../lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()
import { CUTOFF, MIN_RELEASE_AGE_DAYS, args, discard, duMb, exec, fetchJson, fromRoot, loadTargets, measure, oldEnough, readJson, removeDir, round, spread, sweep, timed, writeJson } from './lib.mjs'

const { names, value, has } = args('Usage: node scripts/sweep-types/rubygems.mjs <gem>... | --top=N [--force] [--retry-failed] [--runs=11] [--std=exclude|include] [--keep] [--sorbet] [--source] [--out=file]')
const RUNS = Number(value('runs', 11))
// Whether the rbs standard-library signatures a gem loads are counted against it.
const STD = value('std', 'exclude')
if (!['exclude', 'include'].includes(STD)) throw new Error('--std must be exclude or include')
const WORK = fromRoot('.cache/sweep-types/rubygems')
const OUT = value('out') ? path.resolve(value('out')) : has('scan') ? path.join(WORK, 'scan.json') : fromRoot('data/rubygems/types.json')
const GEMS = path.join(WORK, 'gems')
const SIGS = path.join(WORK, 'sigs')
const RUBY = '/opt/homebrew/opt/ruby/bin/ruby'
const RBS = '/opt/homebrew/opt/ruby/bin/rbs'
// --scan: classify only (one run of each checker, no timing), for coverage
// counts. It writes to .cache/, never to the data file.
const SCAN = has('scan')
// Which checker's figure is the entry's `added` and decides its status.
const GRADED = value('graded', 'rbs')
if (!['rbs', 'sorbet'].includes(GRADED)) throw new Error('--graded must be rbs or sorbet')
const { targets, listedVersion } = await loadTargets('rubygems', names, Number(value('top', 0)))
await mkdir(GEMS, { recursive: true })
await mkdir(SIGS, { recursive: true })

const rbsVersion = /\d+\.\d+\.\d+/.exec((await exec(RBS, ['--version'])).stdout)[0]
const rubyVersion = /\d+\.\d+\.\d+/.exec((await exec(RUBY, ['--version'])).stdout)[0]
// Libraries rbs ships signatures for.
const stdlib = new Set((await exec(RUBY, ['-rrbs', '-e', 'puts RBS::Repository::DEFAULT_STDLIB_ROOT.children.select(&:directory?).map { |c| c.basename.to_s }'])).stdout.trim().split('\n'))

// Community type sources are not registries with releases: each is a git
// clone checked out at its newest commit that is at least 7 days old.
async function pinnedClone(repo) {
  const dir = path.join(WORK, 'repos', repo.split('/')[1])
  if (!existsSync(dir)) await exec('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', `https://github.com/${repo}`, dir])
  else await exec('git', ['-C', dir, 'fetch', '--quiet', 'origin']).catch(() => console.error(`could not update ${repo}; using the clone as it is`))
  const commit = (await exec('git', ['-C', dir, 'rev-list', '-1', `--before=${new Date(CUTOFF).toISOString()}`, 'origin/HEAD'])).stdout.trim()
  if (!commit) throw new Error(`${repo}: no commit at least ${MIN_RELEASE_AGE_DAYS} days old`)
  await exec('git', ['-C', dir, 'checkout', '--quiet', commit])
  return { dir, commit }
}
const collectionRepo = await pinnedClone('ruby/gem_rbs_collection')
const collection = new Set((await readdir(path.join(collectionRepo.dir, 'gems'), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name))
const cmpVersion = (a, b) => a.split('.').map(Number).reduce((r, n, i) => r || n - (Number(b.split('.')[i]) || 0), 0)
// One directory per supported version line: the newest not newer than the gem.
async function collectionDir(name, version) {
  const dirs = (await readdir(path.join(collectionRepo.dir, 'gems', name), { withFileTypes: true })).filter((e) => e.isDirectory() && /^\d/.test(e.name)).map((e) => e.name).sort(cmpVersion)
  if (dirs.length === 0) return null
  return path.join(collectionRepo.dir, 'gems', name, dirs.filter((d) => !version || cmpVersion(d, version) <= 0).at(-1) ?? dirs[0])
}
// A collection directory also holds _test/ with its own .rbs: copy without it.
async function collectionCopy(name, version, scratch) {
  const dir = await collectionDir(name, version)
  if (!dir) return null
  const dest = path.join(scratch, 'collection', name)
  await mkdir(dest, { recursive: true })
  for (const f of await readdir(dir)) if (f.endsWith('.rbs') || f === 'manifest.yaml') await writeFile(path.join(dest, f), await readFile(path.join(dir, f)))
  return { dir: dest, from: `gem_rbs_collection/${path.basename(dir)}` }
}
const manifestNames = async (sigDir) => [...(await readFile(path.join(sigDir, 'manifest.yaml'), 'utf8').catch(() => '')).matchAll(/^\s*-\s*name:\s*([\w-]+)/gm)].map((m) => m[1])

const versionsCache = new Map()
const versionsOf = (name) => {
  if (!versionsCache.has(name)) versionsCache.set(name, fetchJson(`https://rubygems.org/api/v1/versions/${name}.json`))
  return versionsCache.get(name)
}
// Releases that may be used at all: the platform-independent build (it holds
// the sources and signatures), stable, at least 7 days old. Highest first.
const eligibleReleases = async (name) => (await versionsOf(name)).filter((v) => v.platform === 'ruby' && !v.prerelease && !v.yanked && oldEnough(v.created_at))

async function download(name, release) {
  const file = path.join(GEMS, `${name}-${release.number}.gem`)
  if (!existsSync(file)) {
    const res = await fetch(`https://rubygems.org/downloads/${name}-${release.number}.gem`)
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${name}-${release.number}.gem`)
    const bytes = Buffer.from(await res.arrayBuffer())
    if (createHash('sha256').update(bytes).digest('hex') !== release.sha) throw new Error(`checksum mismatch: ${name}-${release.number}.gem`)
    await writeFile(file, bytes)
  }
  return file
}
// The gemspec, read with RubyGems' own safe YAML loader; no gem code runs.
const gemspec = async (file) => JSON.parse((await exec(RUBY, ['-rrubygems/package', '-rjson', '-e', 's=Gem::Package.new(ARGV[0]).spec; puts JSON.generate(require_paths: s.require_paths, extensions: s.extensions, dependencies: s.runtime_dependencies.map { |d| [d.name, d.requirement.to_s] })', file])).stdout)
// bsdtar refuses absolute paths and `..` unless given -P.
async function unpack(file, dir, only) {
  await removeDir(dir)
  await mkdir(path.join(dir, 'data'), { recursive: true })
  await exec('tar', ['-xf', file, '-C', dir, 'data.tar.gz'])
  // With a pattern that matches nothing tar exits 1: that is "no sig/".
  await exec('tar', ['-xzf', path.join(dir, 'data.tar.gz'), '-C', path.join(dir, 'data'), ...(only ? ['--include', only] : [])]).catch((err) => { if (!only) throw err })
  await rm(path.join(dir, 'data.tar.gz'), { force: true })
}

async function fetchGem(name, wanted, dir) {
  const releases = await eligibleReleases(name)
  const release = releases.find((v) => v.number === wanted) ?? releases[0]
  if (!release) throw new Error(`release-age gate: no ${name} release at least ${MIN_RELEASE_AGE_DAYS} days old`)
  const file = await download(name, release)
  await unpack(file, dir)
  return { version: release.number, root: path.join(dir, 'data'), spec: await gemspec(file) }
}

// A dependency: the highest eligible release that satisfies the requirement,
// its sig/ only, kept across gems (most of a sweep shares its dependencies).
const dependencyCache = new Map()
function dependency(name, requirement) {
  const key = `${name} ${requirement}`
  if (!dependencyCache.has(key)) dependencyCache.set(key, (async () => {
    const releases = await eligibleReleases(name).catch(() => [])
    if (releases.length === 0) return null
    const number = (await exec(RUBY, ['-e', 'req = Gem::Requirement.new(*ARGV[0].split(", ")); puts ARGV[1..].find { |v| req.satisfied_by?(Gem::Version.new(v)) }', requirement, ...releases.map((v) => v.number)])).stdout.trim()
    const release = releases.find((v) => v.number === number)
    if (!release) return null
    const dir = path.join(SIGS, `${name}-${number}`)
    let spec = await readJson(path.join(dir, 'spec.json'), null)
    if (!spec) {
      const file = await download(name, release)
      await unpack(file, dir, 'sig/*')
      spec = await gemspec(file)
      await writeJson(path.join(dir, 'spec.json'), spec)
    }
    const sig = path.join(dir, 'data', 'sig')
    return { version: number, sig: (await walk(sig, '.rbs')).length ? sig : null, dependencies: spec.dependencies }
  })())
  return dependencyCache.get(key)
}

async function walk(dir, ext, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) await walk(p, ext, out)
    else if (e.name.endsWith(ext)) out.push(p)
  }
  return out
}

// The rbs arguments that load a gem's signatures and its dependencies'.
async function signatureSet(name, own, gemDeps, scratch) {
  const libraries = new Set(own.library ? [own.library] : [])
  const dirs = own.dir ? [own.dir] : []
  const from = {}
  const missing = []
  const seen = new Set([name])
  const queue = [...gemDeps.map(([n, r]) => ({ name: n, requirement: r })), ...(own.dir ? await manifestNames(own.dir) : []).map((n) => ({ name: n, manifest: true }))]
  for (let dep; (dep = queue.shift()); ) {
    if (seen.has(dep.name)) continue
    seen.add(dep.name)
    // rbs's own signatures first: its libraries load each other, and a gem's
    // copy of the same declarations beside them would be a duplicate.
    if (stdlib.has(dep.name)) {
      libraries.add(dep.name)
      from[dep.name] = 'rbs-stdlib'
      continue
    }
    const gem = dep.manifest ? null : await dependency(dep.name, dep.requirement)
    let sigDir = gem?.sig ?? null
    if (sigDir) from[dep.name] = `bundled@${gem.version}`
    else if (collection.has(dep.name)) {
      const copy = await collectionCopy(dep.name, gem?.version, scratch)
      if (copy) {
        sigDir = copy.dir
        from[dep.name] = copy.from
      }
    }
    if (sigDir) {
      dirs.push(sigDir)
      queue.push(...(await manifestNames(sigDir)).map((n) => ({ name: n, manifest: true })))
    } else missing.push(dep.name)
    // Signatures of a dependency can name its own dependencies' types.
    if (gem) queue.push(...gem.dependencies.map(([n, r]) => ({ name: n, requirement: r })))
  }
  // The standard library of the set: rbs's libraries other than the gem's own.
  const standardLibraries = [...libraries].filter((l) => l !== own.library).sort()
  return { argv: [RBS, ...[...libraries].flatMap((l) => ['-r', l]), ...dirs.flatMap((d) => ['-I', d]), 'validate'], from, missing, standardLibraries }
}

const base = path.join(WORK, '__baseline__')
await mkdir(path.join(base, 'sig'), { recursive: true })
await mkdir(path.join(base, 'cwd'), { recursive: true })
await writeFile(path.join(base, 'sig', 'empty.rbs'), '')
await writeFile(path.join(base, 'sig-invalid.rbs'), 'class SweepInvalid\n  def bad: () -> NoSuchTypeAnywhere\nend\n')
// An empty working directory: rbs must not pick up a collection lockfile.
const RUN = { cwd: path.join(base, 'cwd') }
{
  const bad = path.join(base, 'invalid')
  await mkdir(bad, { recursive: true })
  await writeFile(path.join(bad, 'invalid.rbs'), await readFile(path.join(base, 'sig-invalid.rbs')))
  if ((await timed([RBS, '-I', bad, 'validate'], RUN)).status === 0) throw new Error('rbs validate accepted a deliberate error')
}
const baseline = await measure([RBS, '-I', path.join(base, 'sig'), 'validate'], RUN, SCAN ? 1 : RUNS)
if (baseline.runs.some((r) => r.status !== 0)) throw new Error('rbs validate failed on the empty baseline')
console.error(`rbs ${rbsVersion} baseline: ${baseline.cpuMs} ms CPU (spread ${spread(baseline.runs.map((r) => r.cpuMs))}), ${baseline.peakRssMb} MB`)

// Sorbet, the second checker, only for gems with real Sorbet types.
const lock = await readJson(fromRoot('toolchains/checkers.json'))
const SORBET_BIN = fromRoot(`.cache/checkers/ruby/gems/sorbet-static-${lock.sorbet}-${lock.sorbetPlatform}/libexec/sorbet`)
if (!existsSync(SORBET_BIN)) throw new Error('Run node scripts/setup-checkers.mjs first')
const SORBET = [SORBET_BIN, '--no-config', '--no-error-sections']
const ENTRY = (requireName) => `# typed: true\n${requireName ? `require ${JSON.stringify(requireName)}\n` : ''}`
await writeFile(path.join(base, 'entry.rb'), ENTRY(null))
await writeFile(path.join(base, 'invalid.rb'), '# typed: true\nextend T::Sig\nsig { returns(Integer) }\ndef bad; "wrong"; end\n')
if ((await timed([...SORBET, path.join(base, 'invalid.rb')])).status === 0) throw new Error('Sorbet accepted a deliberate type error')
const sorbetBaseline = SCAN ? null : await measure([...SORBET, path.join(base, 'entry.rb')], {}, RUNS)
if (sorbetBaseline) console.error(`sorbet ${lock.sorbet} baseline: ${sorbetBaseline.cpuMs} ms CPU (spread ${spread(sorbetBaseline.runs.map((r) => r.cpuMs))}), ${sorbetBaseline.peakRssMb} MB`)

// The standard-library reference: only the given rbs libraries, beside the
// baseline's empty directory. One measurement per list of libraries, shared
// by every gem of the run with the same list.
const stdProbes = new Map()
function standardLibrary(libraries) {
  const key = libraries.join(' ')
  if (!stdProbes.has(key)) stdProbes.set(key, (async () => {
    const m = await measure([RBS, ...libraries.flatMap((l) => ['-r', l]), '-I', path.join(base, 'sig'), 'validate'], RUN, RUNS)
    if (m.runs.some((r) => r.status !== 0)) throw new Error(`standard-library reference failed: rbs validate of ${libraries.join(', ')}`)
    return { cpuMs: m.cpuMs, peakRssMb: m.peakRssMb, timeMs: m.timeMs }
  })())
  return stdProbes.get(key)
}

// Median of the runs minus the standard-library reference when there is one,
// else minus the checker's baseline; never below zero in `added` (small
// signatures sit inside the noise of the reference). `wholeTree` is always
// the figure over the baseline.
async function figure(argv, options, against, std = null) {
  const m = await measure(argv, options, RUNS)
  if (m.runs.some((r) => r.status !== 0)) return null
  const cpuMs = round(m.cpuMs - (std ?? against).cpuMs, 1)
  const memoryMb = round(m.peakRssMb - (std ?? against).peakRssMb, 1)
  return {
    added: { cpuMs: Math.max(0, cpuMs), memoryMb: Math.max(0, memoryMb) }, cpuMs, memoryMb, timeMs: round(m.timeMs - (std ?? against).timeMs, 1),
    wholeTree: { cpuMs: round(m.cpuMs - against.cpuMs, 1), memoryMb: round(m.peakRssMb - against.peakRssMb, 1) },
    ...(std ? { standardLibrary: { cpuMs: round(std.cpuMs - against.cpuMs, 1), memoryMb: round(std.peakRssMb - against.peakRssMb, 1) } } : {}),
    cpuSpreadMs: spread(m.runs.map((r) => r.cpuMs)), baseline: { cpuMs: against.cpuMs, peakRssMb: against.peakRssMb }, runs: m.runs,
  }
}

async function checkRbs(name, gem, dir) {
  const ownSig = path.join(gem.root, 'sig')
  // The gem's own signatures: its sig/, else the collection, else rbs's own.
  let own = null
  if ((await walk(ownSig, '.rbs')).length) own = { dir: ownSig, from: 'bundled' }
  else if (collection.has(name)) own = await collectionCopy(name, gem.version, dir)
  if (!own && stdlib.has(name)) own = { library: name, from: 'rbs-stdlib' }
  if (!own) return { status: 'untyped' }
  const set = await signatureSet(name, own, gem.spec.dependencies, dir)
  // Signatures the gem does not ship itself are community types: the
  // collection's, and those rbs carries for default gems.
  const result = { typesFrom: own.from, ...(own.from === 'bundled' ? {} : { communityTypes: true }), dependencySignatures: set.from, ...(set.missing.length ? { dependenciesWithoutSignatures: set.missing } : {}), standardLibraries: set.standardLibraries }
  const probe = await timed(set.argv, RUN)
  if (probe.status !== 0) {
    const errors = (probe.stdout + '\n' + probe.stderr).split('\n').filter((l) => /ERROR -- rbs:|\(RBS::\w+\)/.test(l)).map((l) => l.replace(/\x1b\[[\d;]*m/g, '').replace(/^.*ERROR -- rbs:\s*/, '').replaceAll(dir, '').replaceAll(WORK, ''))
    return { status: 'check-failed', ...result, errors: errors.length, detail: (errors[0] ?? probe.stderr.trim().split('\n').at(-1) ?? '').slice(0, 300) }
  }
  if (SCAN) return { status: 'ok', ...result }
  // A set with no library of rbs's but the gem's own has the baseline for reference.
  const std = STD === 'exclude' ? (set.standardLibraries.length ? await standardLibrary(set.standardLibraries) : baseline) : null
  const measured = await figure(set.argv, RUN, baseline, std)
  return measured ? { status: 'ok', ...result, ...measured } : { status: 'check-failed', ...result, detail: 'a measured run failed' }
}

async function checkSorbet(name, gem, dir) {
  const libDirs = gem.spec.require_paths.map((p) => path.join(gem.root, p)).filter((d) => existsSync(d))
  const lib = (await Promise.all(libDirs.map((d) => walk(d, '.rb')))).flat()
  let sigils = 0
  let withSigs = 0
  for (const f of lib) {
    const text = await readFile(f, 'utf8').catch(() => '')
    if (/^#\s*typed:\s*(true|strict|strong)\b/m.test(text.slice(0, 400))) sigils++
    if (/^\s*sig\s*(\{|do\b)/m.test(text)) withSigs++
  }
  const rbiFiles = (await walk(path.join(gem.root, 'rbi'), '.rbi')).length
  const facts = { rbiFiles, typedSigilFiles: sigils, filesWithSigs: withSigs, libFiles: lib.length }
  // Real Sorbet types: RBI shipped in the gem, or a source written for Sorbet
  // (at least half its files `# typed: true` or stricter, with sig blocks).
  // Community annotations (Shopify/rbi-central) are not the gem's own types.
  const typesFrom = rbiFiles ? 'bundled-rbi' : withSigs && sigils >= lib.length / 2 ? 'inline-sigs' : null
  if (!typesFrom) return { status: 'untyped', ...facts }
  const candidates = [name, name.replaceAll('-', '_'), name.replaceAll('-', '/')]
  const requireName = candidates.find((c) => libDirs.some((d) => existsSync(path.join(d, c + '.rb')))) ?? null
  const entry = path.join(dir, 'entry.rb')
  await writeFile(entry, ENTRY(requireName))
  // The gem's source goes in beside its RBI: shipped RBI declares signatures
  // for classes it does not define. Files without a sigil are typed: false, so
  // they contribute definitions, not checked bodies.
  const types = rbiFiles ? [path.join(gem.root, 'rbi')] : []
  const argv = [...SORBET, entry, ...types, ...libDirs]
  const result = { typesFrom, ...facts }
  const probe = await timed(argv)
  let accepted = probe.status === 0
  if (!accepted) {
    // Errors only in typed: false source (constants of gems that are not
    // there) do not stop Sorbet doing the work; any other error does.
    const lines = (probe.stdout + '\n' + probe.stderr).split('\n').filter((l) => /https:\/\/srb\.help\/\d+/.test(l))
    const inTypes = typesFrom === 'inline-sigs' ? lines : lines.filter((l) => l.startsWith(entry) || types.some((t) => l.startsWith(t)))
    if (inTypes.length || lines.length === 0) return { status: 'check-failed', ...result, errors: lines.length, detail: (inTypes[0] ?? probe.stderr.trim().split('\n')[0] ?? '').replaceAll(dir, '').slice(0, 300) }
    result.errorsInUntypedSource = lines.length
  }
  if (SCAN) return { status: 'ok', ...result }
  // Sorbet exits 1 when it reports errors, also the tolerated ones.
  const m = await measure(argv, {}, RUNS)
  const cpuMs = round(m.cpuMs - sorbetBaseline.cpuMs, 1)
  const memoryMb = round(m.peakRssMb - sorbetBaseline.peakRssMb, 1)
  const out = { status: 'ok', ...result, added: { cpuMs: Math.max(0, cpuMs), memoryMb: Math.max(0, memoryMb) }, cpuMs, memoryMb, timeMs: round(m.timeMs - sorbetBaseline.timeMs, 1), cpuSpreadMs: spread(m.runs.map((r) => r.cpuMs)), baseline: { cpuMs: sorbetBaseline.cpuMs, peakRssMb: sorbetBaseline.peakRssMb }, runs: m.runs }
  if (has('source')) {
    const s = await measure([...SORBET, '--typed=false', '--suppress-non-critical', entry, ...libDirs], {}, RUNS)
    out.sourceOnly = { cpuMs: round(s.cpuMs - sorbetBaseline.cpuMs, 1), memoryMb: round(s.peakRssMb - sorbetBaseline.peakRssMb, 1) }
  }
  return out
}

async function measurePackage({ name }) {
  const dir = path.join(WORK, 'work', name)
  try {
    let gem
    try {
      gem = await fetchGem(name, listedVersion[name], dir)
    } catch (err) {
      return { status: 'install-failed', listedVersion: listedVersion[name], detail: String(err.message).slice(0, 300) }
    }
    const checks = { rbs: await checkRbs(name, gem, dir), sorbet: await checkSorbet(name, gem, dir) }
    const graded = checks[GRADED]
    // The entry's status and `added` are the graded checker's. A gem typed
    // only for the other checker is `untyped` here, with that figure in `checks`.
    return {
      status: graded.status,
      version: gem.version,
      listedVersion: listedVersion[name],
      gradedBy: GRADED,
      ...(graded.typesFrom ? { typesFrom: graded.typesFrom } : {}),
      ...(graded.communityTypes ? { communityTypes: true } : {}),
      ...(graded.status === 'ok' && graded.added ? { added: graded.added } : {}),
      ...(graded.detail ? { detail: graded.detail } : {}),
      nativeExtension: gem.spec.extensions.length > 0,
      dependencies: gem.spec.dependencies.length,
      unpackedMb: await duMb(gem.root),
      checks,
    }
  } finally {
    if (!has('keep')) await discard(dir)
  }
}

const checkers = { rbs: { tool: 'rbs validate', version: rbsVersion }, sorbet: { tool: 'Sorbet', version: lock.sorbet } }
const header = {
  // The graded checker, and both.
  checker: checkers[GRADED],
  checkers,
  method: { graded: GRADED, standardLibrary: STD === 'exclude' ? 'rbs: not counted, minus a probe loading the same rbs stdlib libraries; sorbet: in the baseline (its payload)' : 'rbs: counted; sorbet: in the baseline (its payload)', ruby: rubyVersion, rbsSources: ['bundled sig/', 'ruby/gem_rbs_collection', 'rbs stdlib'], rbsDependencies: 'runtime closure: rbs stdlib, bundled sig/, collection', sorbetSources: ['bundled rbi/', 'inline sigs'], sorbetFlags: SORBET.slice(1) },
  communityTypes: { 'ruby/gem_rbs_collection': collectionRepo.commit },
  minReleaseAgeDays: MIN_RELEASE_AGE_DAYS,
  memoryKind: 'peak RSS of the checker process',
  scoreBasis: 'added process CPU ms * added peak RSS MB',
  runs: RUNS,
  baseline: GRADED === 'rbs' ? baseline : sorbetBaseline,
  baselines: { rbs: baseline, sorbet: sorbetBaseline },
}
const one = (id, c) => `${id} ${c.status === 'ok' ? (c.added ? `+${c.cpuMs} ms (spread ${c.cpuSpreadMs}${c.wholeTree ? `; whole tree ${c.wholeTree.cpuMs}` : ''}) +${c.memoryMb} MB${c.wholeTree ? ` (whole tree ${c.wholeTree.memoryMb}), ${c.standardLibraries.length} std` : ''}` : 'ok') + ` [${c.typesFrom}]` : c.status}${c.status === 'check-failed' ? ` (${c.detail?.slice(0, 110)})` : ''}`
await sweep({
  out: OUT,
  header,
  targets,
  force: has('force'),
  retryFailed: has('retry-failed'),
  measureOne: measurePackage,
  // A scan has no figures; it is never written where `ok` must carry `added`.
  allowOkWithoutAdded: SCAN,
  summary: (r) => (r.checks ? `${one('rbs', r.checks.rbs)} | ${one('sorbet', r.checks.sorbet)}` : `${r.status}: ${r.detail}`) + ` v${r.version ?? '?'}`,
})
