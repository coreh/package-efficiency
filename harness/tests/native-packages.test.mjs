// Packages from PyPI, RubyGems and the Go module proxy in synchronous,
// asynchronous and client tasks (scripts/lib/native-packages.mjs): the naming
// rule for Go modules, which kinds of task take them and how a client task
// starts one, and the locks on record. Nothing here uses the network.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,globSync,readFileSync} from 'node:fs'
import path from 'node:path'
import {fromRoot} from '../../scripts/lib/util.mjs'
import {goFamily,goPackageName} from '../../scripts/lib/ecosystems.mjs'
import {GO_RUNNERS,PACKAGE_TASK_KINDS} from '../../scripts/lib/native-packages.mjs'
import {prepareNativeClient} from '../../scripts/lib/client-tasks.mjs'
const read=file=>JSON.parse(readFileSync(file,'utf8'))
test('a Go module has one short name, whatever its major version',()=>{
 assert.equal(goPackageName('github.com/goccy/go-json'),'goccy-go-json')
 assert.equal(goPackageName('github.com/go-chi/chi/v5'),'go-chi-chi')
 assert.equal(goPackageName('github.com/BurntSushi/toml'),'burntsushi-toml')
 assert.equal(goPackageName('golang.org/x/text'),'golang.org-x-text')
 assert.equal(goPackageName('gopkg.in/yaml.v3'),'gopkg.in-yaml')
 assert.equal(goFamily('github.com/labstack/echo/v4'),goFamily('github.com/labstack/echo/v5'))
})
test('operation and client tasks take packages; servers and applications install their own',()=>{
 assert.deepEqual(PACKAGE_TASK_KINDS,{'sync-operation':'operation','async-operation':'operation',client:'client'})
 for(const kind of ['http-server','server-startup'])assert.ok(!(kind in PACKAGE_TASK_KINDS))
 // An asynchronous task's Go adapter blocks until its goroutines are done, so
 // it is built with the operation runner, which calls prepare; a client is
 // built with the client runner, which has none.
 assert.equal(GO_RUNNERS.operation.file,'harness/go/runner.go')
 assert.equal(GO_RUNNERS.operation.prepare,true)
 assert.equal(GO_RUNNERS.client.file,'harness/go/client-runner.go')
 assert.equal(GO_RUNNERS.client.prepare,false)
 for(const {file} of Object.values(GO_RUNNERS))assert.ok(existsSync(fromRoot(file)),file)
})
test('a Go module client is built with the client runner and started as built',async()=>{
 const asked=[],rt={bin:'go',version:'1.25.3'}
 const prepareNativePackage=async(options)=>{asked.push(options);return {command:'/built/runner',workdir:'/built',version:'v1.2.3',dependencies:{'example.com/dep':'v0.1.0'},env:{}}}
 const prepared=await prepareNativeClient({taskId:'http-client/get-json',target:{ecosystem:'gomod',name:'example-client',dir:'/adapter'},meta:{language:'go',runtimes:['go'],module:'example.com/client'},runtimeId:'go',rt,config:{},goBaseline:async()=>'/baseline/runner',prepareNativePackage})
 assert.equal(asked.length,1)
 assert.equal(asked[0].runner,'client')
 assert.equal(prepared.launch.command,'/built/runner')
 assert.deepEqual(prepared.launch.args,[])
 assert.deepEqual(prepared.launch.phases,['boot','ready'])
 assert.deepEqual(prepared.base,{command:'/baseline/runner',args:['-'],cwd:fromRoot()})
 assert.equal(prepared.extra.version,'v1.2.3')
 assert.deepEqual(prepared.extra.dependencies,{'example.com/dep':'v0.1.0'})
})
test('a client package that cannot run on a runtime is passed back as not available',async()=>{
 const prepared=await prepareNativeClient({taskId:'t/t',target:{ecosystem:'pypi',name:'x',dir:'/adapter'},meta:{language:'python',runtimes:['pypy']},runtimeId:'pypy',rt:{bin:'pypy3',args:[]},config:{},goBaseline:async()=>null,prepareNativePackage:async()=>({version:'1.0',unavailable:'no wheel'})})
 assert.equal(prepared.unavailable,'no wheel')
})
const adapters=globSync(fromRoot('benchmarks/*/*/{pypi,rubygems,gomod}/*/adapter.json')).filter(file=>{
 const [category,task]=path.relative(fromRoot('benchmarks'),file).split(path.sep)
 return category!=='_shared'&&task!=='_shared'&&read(fromRoot('benchmarks',category,task,'task.json')).kind in PACKAGE_TASK_KINDS
})
const pins=read(fromRoot('versions.json'))
const sha=/^[0-9a-f]{64}$/,day=/^\d{4}-\d{2}-\d{2}$/
for(const file of adapters){
 const dir=path.dirname(file),[category,task,registry,name]=path.relative(fromRoot('benchmarks'),dir).split(path.sep)
 const meta=read(file),id=`${category}/${task}/${registry}/${name}`,packageName=meta.package??name
 // An adapter not run yet has no lock; the first run writes it.
 if(registry==='gomod')test(`${id}: named for its module, pinned, with go.mod and go.sum`,(t)=>{
  assert.equal(packageName,goPackageName(meta.module))
  if(!existsSync(path.join(dir,'go.mod')))return t.skip('not resolved yet')
  // On a line of its own, or inside a require ( ... ) block when the adapter imports more than one module.
  const required=new RegExp(`^(?:require |\\t)${meta.module.replaceAll('.','\\.')} (\\S+)$`,'m').exec(readFileSync(path.join(dir,'go.mod'),'utf8'))
  assert.ok(required,'go.mod requires the module')
  assert.equal(required[1],pins.gomod[packageName])
  assert.ok(readFileSync(path.join(dir,'go.sum'),'utf8').includes(`${meta.module} ${required[1]} h1:`))
 })
 else test(`${id}: locked files have checksums and dates, and the pinned version`,(t)=>{
  if(!existsSync(path.join(dir,'lock.json')))return t.skip('not resolved yet')
  const lock=read(path.join(dir,'lock.json'))
  assert.equal(lock.registry,registry)
  assert.equal(lock.package,packageName)
  assert.equal(lock.version,pins[registry][packageName])
  const environments=Object.values(lock.environments)
  assert.ok(environments.some(e=>!e.unavailable),'runs somewhere')
  for(const environment of environments){
   if(environment.unavailable){assert.equal(typeof environment.unavailable,'string');continue}
   const files=environment.packages??environment.gems
   assert.equal(files.find(f=>f.name===packageName).version,lock.version)
   for(const f of files){
    assert.match(f.sha256,sha);assert.match(f.published,day)
    // Published at least seven days before today, as it was when chosen.
    assert.ok(Date.parse(f.published)<=Date.now()-7*864e5,`${f.name} ${f.version}`)
    assert.equal(typeof (registry==='pypi'?f.compiled:f.compiles),'boolean')
    if(registry==='pypi')assert.ok(f.file.endsWith('.whl'),'wheels only')
   }
  }
 })
}
