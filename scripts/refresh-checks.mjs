// Refresh process-CPU-based checker measurements sequentially, on an idle host.
// By default everything is measured again. With --incremental only what is
// missing is measured: TypeScript packages with no result yet, Rust crates
// with no check yet, and Python, Ruby or Go adapters whose source changed
// (those three are re-checked a whole language at a time).
import {spawnSync} from 'node:child_process'
import {readJson,fromRoot} from './lib/util.mjs'
import {adaptersOf,taskIds} from './lib/tasks.mjs'
// Every package that already has a check, and every npm or JSR package that
// has a benchmark adapter, so a newly added package is measured too.
const adapted=[]
for(const task of taskIds())for(const adapter of await adaptersOf(task)){
  const [registry,...rest]=adapter.id.split('/')
  if(registry==='npm'||registry==='jsr')adapted.push(adapter.package??rest.join('/'))
}
const names=[...new Set([...Object.keys((await readJson(fromRoot('data/types.json'),{packages:{}})).packages),...adapted])]
const incremental=process.argv.includes('--incremental')
const ts=spawnSync(process.execPath,['scripts/measure-types.mjs',...names,...(incremental?[]:['--force'])],{stdio:'inherit',env:{...process.env,npm_config_cache:fromRoot('.cache/npm')}})
if(ts.status!==0)process.exit(ts.status??1)
const rust=spawnSync(process.execPath,['scripts/measure-rust-check.mjs',...(incremental?['--missing']:[])],{stdio:'inherit'})
if(rust.status!==0)process.exit(rust.status??1)
const native=spawnSync(process.execPath,['scripts/measure-native-checks.mjs',...(incremental?['--missing']:[])],{stdio:'inherit'})
process.exitCode=native.status??1
