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
import { raisePriority } from './lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()

const exec = promisify(execFile)
const WARM_RUNS = 3
// Timed with harness/checkers/time.py: wait4 on the child, which reports CPU
// to the microsecond and the peak memory of the largest process in the tree
// (rustc). /usr/bin/time prints CPU only to 10 ms, too coarse for a small crate.
const TIMER = ['/opt/homebrew/bin/python3', fromRoot('harness/checkers/time.py')]

async function check(crate, bin, targetDir) {
  const { stdout } = await exec(TIMER[0], [TIMER[1], 'cargo', 'check', '--locked', '--quiet', '-p', crate, ...(bin ? ['--bin', bin] : [])], {
    cwd: ROOT,
    // Incremental state would make the warm check depend on what ran before.
    env: { ...process.env, CARGO_TARGET_DIR: targetDir, CARGO_INCREMENTAL: '0' },
    maxBuffer: 64 << 20,
  })
  const run = JSON.parse(stdout)
  if (run.status !== 0) throw new Error(`cargo check failed for ${crate}: ${run.stderr.trim().split('\n')[0]}`)
  return { wallS: run.timeMs / 1000, cpuS: run.cpuMs / 1000, peakRssMb: run.peakRssMb }
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
