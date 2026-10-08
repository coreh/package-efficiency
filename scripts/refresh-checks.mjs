// Refresh process-CPU-based checker measurements sequentially, on an idle host.
// By default everything is measured again. With --incremental only what is
// missing is measured: TypeScript packages with no result yet, Rust crates
// with no check yet, and Python, Ruby or Go adapters whose source changed
// (those three are re-checked a whole language at a time).
// Then the five sweeps of the most used packages (JSR, PyPI, RubyGems,
// crates.io, Go modules; 1,000 each plus the hand-picked ones), one after another. With
// --incremental they skip what already has a result; otherwise everything is
// measured again. --no-sweep leaves them out, for a quick run. A sweep that
// fails is reported and the others still run.
import {spawnSync} from 'node:child_process'
import {readJson,fromRoot} from './lib/util.mjs'
import {adaptersOf,taskIds} from './lib/tasks.mjs'
import { raisePriority } from './lib/util.mjs'
// Above the usual priority where the machine allows it (see raisePriority).
raisePriority()
// Every package that already has a check, and every npm or JSR package that
// has a benchmark adapter, so a newly added package is measured too.
const adapted=[]
for(const task of taskIds())for(const adapter of await adaptersOf(task)){
  const [registry,...rest]=adapter.id.split('/')
  if(registry==='npm'||registry==='jsr')adapted.push(adapter.package??rest.join('/'))
}
// JSR packages recorded by the JSR sweep are left to that sweep: by name alone
// this step would install them from npm.
const names=[...new Set([...Object.entries((await readJson(fromRoot('data/types.json'),{packages:{}})).packages).filter(([,r])=>r.registry!=='jsr').map(([name])=>name),...adapted])]
const incremental=process.argv.includes('--incremental')
const ts=spawnSync(process.execPath,['scripts/measure-types.mjs',...names,...(incremental?[]:['--force'])],{stdio:'inherit',env:{...process.env,npm_config_cache:fromRoot('.cache/npm')}})
if(ts.status!==0)process.exit(ts.status??1)
const rust=spawnSync(process.execPath,['scripts/measure-rust-check.mjs',...(incremental?['--missing']:[])],{stdio:'inherit'})
if(rust.status!==0)process.exit(rust.status??1)
const native=spawnSync(process.execPath,['scripts/measure-native-checks.mjs',...(incremental?['--missing']:[])],{stdio:'inherit'})
let failed=native.status!==0
if(!process.argv.includes('--no-sweep')){
  const again=incremental?[]:['--force']
  const sweeps=[
    ['JSR',['scripts/measure-types.mjs','--top=1000','--ecosystem=jsr',...again]],
    ['PyPI',['scripts/sweep-types/pypi.mjs','--top=1000',...again]],
    ['RubyGems',['scripts/sweep-types/rubygems.mjs','--top=1000',...again]],
    ['crates.io',['scripts/sweep-types/cargo.mjs','--top=1000',...again]],
    ['Go modules',['scripts/sweep-types/gomod.mjs','--top=1000',...again]],
  ]
  for(const [title,args] of sweeps){
    console.error(`\ntype-check sweep: ${title}`)
    const run=spawnSync(process.execPath,args,{stdio:'inherit',env:{...process.env,npm_config_cache:fromRoot('.cache/npm')}})
    if(run.status!==0){failed=true;console.error(`type-check sweep of ${title} failed (exit ${run.status??run.signal}); carrying on`)}
  }
}
process.exitCode=failed?1:0
