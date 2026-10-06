// Measure what each Rust adapter costs to type-check with `cargo check`, the
// Rust counterpart of scripts/measure-types.mjs. Writes data/rust-check.json.
//   cold: a first check of the adapter and its whole dependency tree
//   warm: re-checking only the adapter once its dependencies are checked,
//         which is what an editor does on every change
// Usage: node scripts/measure-rust-check.mjs [--missing]
import { execFile, execFileSync } from 'node:child_process'
import { globSync } from 'node:fs'
import { readFile, rm, utimes } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { ROOT, fromRoot, loadConfig, median, readJson, writeJson } from './lib/util.mjs'

const exec = promisify(execFile)
const WARM_RUNS = 3
const TIME = process.platform === 'darwin' ? ['/usr/bin/time', '-l'] : ['/usr/bin/time', '-v']

// Peak memory is the largest single process in the tree, which is rustc.
function parseTime(stderr) {
  if (process.platform === 'darwin') {
    const [, real, user, sys] = /([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/.exec(stderr)
    return { wallS: Number(real), cpuS: Number(user) + Number(sys), peakRssMb: Number(/(\d+)\s+maximum resident set size/.exec(stderr)[1]) / 2 ** 20 }
  }
  const seconds = (label) => Number(new RegExp(`${label} \\(seconds\\): ([\\d.]+)`).exec(stderr)[1])
  const [, m, s] = /Elapsed \(wall clock\) time.*: (?:\d+:)?(\d+):([\d.]+)/.exec(stderr)
  return {
    wallS: Number(m) * 60 + Number(s),
    cpuS: seconds('User time') + seconds('System time'),
    peakRssMb: Number(/Maximum resident set size \(kbytes\): (\d+)/.exec(stderr)[1]) / 1024,
  }
}

async function check(crate, bin, targetDir) {
  const { stderr } = await exec(TIME[0], [TIME[1], 'cargo', 'check', '--locked', '--quiet', '-p', crate, ...(bin ? ['--bin', bin] : [])], {
    cwd: ROOT,
    // Incremental state would make the warm check depend on what ran before.
    env: { ...process.env, CARGO_TARGET_DIR: targetDir, CARGO_INCREMENTAL: '0' },
    maxBuffer: 16 << 20,
  })
  return parseTime(stderr)
}

// Each crate gets its own empty target directory so its cold check pays for
// its whole dependency tree, then the directory is removed again.
async function measure(crate, bin, source) {
  const targetDir = fromRoot('.cache/cargo-check', bin ?? crate)
  await rm(targetDir, { recursive: true, force: true })
  const cold = await check(crate, bin, targetDir)
  const warm = []
  for (let i = 0; i < WARM_RUNS; i++) {
    await utimes(source, new Date(), new Date())
    warm.push(await check(crate, bin, targetDir))
  }
  await rm(targetDir, { recursive: true, force: true })
  const round = (n, digits = 1) => Number(n.toFixed(digits))
  return {
    coldCpuS: round(cold.cpuS),
    coldWallS: round(cold.wallS),
    coldPeakRssMb: round(cold.peakRssMb),
    warmCpuMs: Math.round(median(warm.map((w) => w.cpuS)) * 1000),
    warmWallMs: Math.round(median(warm.map((w) => w.wallS)) * 1000),
    warmPeakRssMb: round(median(warm.map((w) => w.peakRssMb))),
  }
}

execFileSync(process.execPath, ['scripts/check-cargo-age.mjs'], { cwd: ROOT, stdio: 'inherit' })
const { toolchains } = await loadConfig()

const missingOnly = process.argv.includes('--missing')
const previous = missingOnly ? await readJson(fromRoot('data/rust-check.json'), null) : null
if (previous && previous.rust !== toolchains.rust.version) throw new Error('--missing requires the same Rust version; run a full measurement instead')
const baseline = previous?.baseline ?? await measure('bench-harness', 'baseline', fromRoot('harness/rust/src/bin/baseline.rs'))
console.error(`baseline: warm ${baseline.warmPeakRssMb} MB, ${baseline.warmWallMs} ms`)

const crates = previous?.crates ?? {}
for (const manifest of globSync('benchmarks/*/*/cargo/*/Cargo.toml', { cwd: ROOT }).sort()) {
  const dir = path.dirname(manifest)
  const [, category, task, , name] = dir.split(path.sep)
  const id = `${category}/${task}/cargo/${name}`
  if (missingOnly && crates[id]?.warmCpuMs !== undefined) continue
  const crate = /^name = "(.+)"/m.exec(await readFile(fromRoot(manifest), 'utf8'))[1]
  const measured = await measure(crate, null, fromRoot(dir, 'src/main.rs'))
  // What the adapter adds over checking an empty program.
  measured.addedMb = Number(Math.max(0, measured.warmPeakRssMb - baseline.warmPeakRssMb).toFixed(1))
  crates[id] = measured
  await writeJson(fromRoot('data/rust-check.json'), { rust: toolchains.rust.version, baseline, crates })
  console.error(`${name}: cold ${measured.coldCpuS} CPU-s, warm +${measured.addedMb} MB, ${measured.warmWallMs} ms`)
}

await writeJson(fromRoot('data/rust-check.json'), { rust: toolchains.rust.version, baseline, crates })
console.log(`wrote data/rust-check.json (${Object.keys(crates).length} crates)`)
