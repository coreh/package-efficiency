// Refresh process-CPU-based checker measurements sequentially, on an idle host.
import {spawnSync} from 'node:child_process'
import {readJson,fromRoot} from './lib/util.mjs'
const names=Object.keys((await readJson(fromRoot('data/types.json'))).packages)
const ts=spawnSync(process.execPath,['scripts/measure-types.mjs',...names,'--force'],{stdio:'inherit',env:{...process.env,npm_config_cache:fromRoot('.cache/npm')}})
if(ts.status!==0)process.exit(ts.status??1)
const rust=spawnSync(process.execPath,['scripts/measure-rust-check.mjs'],{stdio:'inherit'})
if(rust.status!==0)process.exit(rust.status??1)
const native=spawnSync(process.execPath,['scripts/measure-native-checks.mjs'],{stdio:'inherit'})
process.exitCode=native.status??1
