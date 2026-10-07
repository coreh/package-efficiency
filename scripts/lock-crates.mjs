// Brings Cargo.lock up to date after a Rust adapter was added or its
// Cargo.toml changed, the one safe way: `cargo update --workspace` adds the
// new workspace members and what they need, changes no other pin and
// downloads no source; then every locked crate's release date is checked,
// and any release under seven days old is stepped back to the newest one
// that is old enough. Nothing is built here. scripts/measure.mjs builds.
// Usage: node scripts/lock-crates.mjs
import { execFileSync } from 'node:child_process'
import { ROOT } from './lib/util.mjs'

const run = (command, args) => execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' })
run('cargo', ['update', '--workspace', '--quiet'])
run(process.execPath, ['scripts/check-cargo-age.mjs', '--fix'])
run(process.execPath, ['scripts/check-cargo-age.mjs'])
