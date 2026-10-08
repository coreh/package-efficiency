// Packages from PyPI, RubyGems and the Go module proxy in synchronous tasks
// (scripts/lib/native-packages.mjs): the naming rule for Go modules, and the
// locks on record. Nothing here uses the network.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,globSync,readFileSync} from 'node:fs'
import path from 'node:path'
import {fromRoot} from '../../scripts/lib/util.mjs'
import {goFamily,goPackageName} from '../../scripts/lib/ecosystems.mjs'
const read=file=>JSON.parse(readFileSync(file,'utf8'))
test('a Go module has one short name, whatever its major version',()=>{
 assert.equal(goPackageName('github.com/goccy/go-json'),'goccy-go-json')
 assert.equal(goPackageName('github.com/go-chi/chi/v5'),'go-chi-chi')
 assert.equal(goPackageName('github.com/BurntSushi/toml'),'burntsushi-toml')
 assert.equal(goPackageName('golang.org/x/text'),'golang.org-x-text')
 assert.equal(goPackageName('gopkg.in/yaml.v3'),'gopkg.in-yaml')
 assert.equal(goFamily('github.com/labstack/echo/v4'),goFamily('github.com/labstack/echo/v5'))
})
const adapters=globSync(fromRoot('benchmarks/*/*/{pypi,rubygems,gomod}/*/adapter.json')).filter(file=>{
 const [category,task]=path.relative(fromRoot('benchmarks'),file).split(path.sep)
 return category!=='_shared'&&task!=='_shared'&&read(fromRoot('benchmarks',category,task,'task.json')).kind==='sync-operation'
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
