// Brings Cargo.lock up to date after a Rust adapter was added or its
// Cargo.toml changed, the one safe way: `cargo update --workspace` adds the
// new workspace members and what they need, changes no other pin and
// downloads no source. Cargo itself leaves out any release under seven days
// old (`registry.global-min-publish-age`, stable from Rust 1.101; until then
// the pinned nightly below, used for locking only, while the stable Rust in
// runtimes.json builds). Every locked crate's release date is then checked
// again by check-cargo-age.mjs, and any release under seven days old is
// stepped back to the newest one that is old enough. Nothing is built here.
// scripts/measure.mjs builds.
// Usage: node scripts/lock-crates.mjs
import { execFileSync } from 'node:child_process'
import { ROOT } from './lib/util.mjs'

// Released 2026-10-01, after min-publish-age was stabilized (cargo#17335).
const LOCKING_TOOLCHAIN = 'nightly-2026-10-01'
const run = (command, args) => execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' })
run('cargo', [`+${LOCKING_TOOLCHAIN}`, 'update', '--workspace', '--quiet', '--config', 'registry.global-min-publish-age="7 days"'])
run(process.execPath, ['scripts/check-cargo-age.mjs', '--fix'])
run(process.execPath, ['scripts/check-cargo-age.mjs'])
