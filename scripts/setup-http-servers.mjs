// Install pinned native HTTP dependencies inside the workspace.
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {mkdir,writeFile,copyFile} from 'node:fs/promises'
import {fromRoot,readJson,writeJson} from './lib/util.mjs'
const lock=await readJson(fromRoot('toolchains/http-servers.json'))
const cutoff=Date.now()-7*864e5
const py=fromRoot('.cache/http-servers/python');await mkdir(py,{recursive:true})
if(!process.argv.includes('--go-only')) {
for(const [name,version] of Object.entries(lock.pypi)){
 const meta=await fetch(`https://pypi.org/pypi/${name}/${version}/json`).then(r=>r.json())
 if(!meta.urls.length||meta.urls.some(f=>f.yanked||Date.parse(f.upload_time_iso_8601)>cutoff))throw new Error(`Ineligible PyPI release ${name}`)
}
execFileSync('/opt/homebrew/bin/python3',['-m','pip','install','--disable-pip-version-check','--no-cache-dir','--upgrade','--only-binary=:all:','--no-deps','--target',py,...Object.entries(lock.pypi).map(([n,v])=>`${n}==${v}`)],{stdio:'inherit'})
const rb=fromRoot('.cache/http-servers/ruby');await mkdir(rb,{recursive:true})
for(const name of ['nio4r','rack','puma','roda']){
 const version=lock.rubygems[name]
 const meta=(await fetch(`https://rubygems.org/api/v1/versions/${name}.json`).then(r=>r.json())).find(v=>v.number===version&&v.platform==='ruby')
 if(!meta || Date.parse(meta.created_at)>cutoff)throw new Error(`Ineligible gem ${name}`)
 const gem=fromRoot('.cache/http-servers',`${name}-${version}.gem`)
 const bytes=Buffer.from(await fetch(`https://rubygems.org/downloads/${name}-${version}.gem`).then(r=>r.arrayBuffer()))
 if(createHash('sha256').update(bytes).digest('hex')!==meta.sha)throw new Error(`Gem checksum failed: ${name}`)
 await writeFile(gem,bytes)
 execFileSync('/opt/homebrew/opt/ruby/bin/gem',['install','--local',gem,'--install-dir',rb,'--ignore-dependencies','--no-document'],{stdio:'inherit',env:{...process.env,GEM_HOME:rb,GEM_PATH:rb}})
}
}
const env={...process.env,GOCACHE:fromRoot('.cache/go-build'),GOPATH:fromRoot('.cache/go-path'),GOMODCACHE:fromRoot('.cache/go-mod'),GOTOOLCHAIN:'local'}
for(const [name,module] of [['go-net-http',null],['chi','github.com/go-chi/chi/v5'],['gin','github.com/gin-gonic/gin']]){
 const dir=fromRoot('benchmarks/http-server/json-api',module?'gomod':'builtin',name)
 await writeFile(`${dir}/go.mod`,`module bench/${name}\n\ngo 1.25.0\n${module?`\nrequire ${module} ${lock.gomod[module]}\n`:''}`)
 await copyFile(fromRoot('harness/go/http-runner.go'),`${dir}/runner.go`)
 execFileSync('/opt/homebrew/bin/go',['mod','tidy'],{cwd:dir,env,stdio:'inherit'})
 const text=execFileSync('/opt/homebrew/bin/go',['list','-m','-json','all'],{cwd:dir,env,encoding:'utf8'})
 const modules=JSON.parse('['+text.trim().replace(/}\s*{/g,'},{')+']')
 for(const m of modules.filter(m=>m.Version)){
  const escaped=m.Path.replace(/[A-Z]/g,c=>'!'+c.toLowerCase())
  const info=await fetch(`https://proxy.golang.org/${escaped}/@v/${m.Version}.info`).then(r=>r.json())
  if(!info.Time||Date.parse(info.Time)>cutoff)throw new Error(`Ineligible module ${m.Path}@${m.Version}`)
 }
}
const manifest=await readJson(fromRoot('versions.json'))
manifest.pypi=lock.pypi;manifest.rubygems=lock.rubygems;manifest.gomod={chi:lock.gomod['github.com/go-chi/chi/v5'],gin:lock.gomod['github.com/gin-gonic/gin']}
await writeJson(fromRoot('versions.json'),manifest)
