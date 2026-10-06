import {execFileSync} from 'node:child_process'
import {mkdir,copyFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {ROOT,fromRoot,readJson} from './util.mjs'
// A variant (adapter.json `variantOf`) has no source of its own: it runs the
// named sibling adapter with the extra environment in its `env`, so the same
// code is measured under a different setting such as a thread count.
export async function prepareNativeHttp(target,meta,rt) {
 const pins=await readJson(fromRoot('toolchains/http-servers.json'))
 const dependencies={}
 const sourceName=meta.variantOf??target.name
 const sourceDir=meta.variantOf?path.join(path.dirname(target.dir),meta.variantOf):target.dir
 const packageName=meta.package??target.name
 for(const name of [packageName,...(meta.dependencies??[])]) if(pins[target.ecosystem]?.[name])dependencies[name]=pins[target.ecosystem][name]
 let command=rt.bin,args,base
 if(meta.language==='go'){
  const work=sourceDir
  const out=fromRoot('.cache/work/http-server/json-api',target.ecosystem,sourceName,'runner')
  await mkdir(path.dirname(out),{recursive:true})
  // The module and sums live with the adapter; binaries stay in the cache.
  await copyFile(fromRoot('harness/go/http-runner.go'),path.join(work,'runner.go'))
  const env={...process.env,GOCACHE:fromRoot('.cache/go-build'),GOPATH:fromRoot('.cache/go-path'),GOMODCACHE:fromRoot('.cache/go-mod'),GOTOOLCHAIN:'local'}
  execFileSync(rt.bin,['build','-mod=readonly','-o',out,'.'],{cwd:work,env,stdio:'inherit'})
  const baseDir=fromRoot('.cache/work/go-http-baseline');await mkdir(baseDir,{recursive:true})
  await copyFile(fromRoot('harness/go/http-runner.go'),path.join(baseDir,'runner.go'))
  await writeFile(path.join(baseDir,'adapter.go'),'package main\nimport "net/http"\nfunc handler() http.Handler { return nil }\n')
  const baseBin=path.join(baseDir,'runner')
  execFileSync(rt.bin,['build','-o',baseBin,'runner.go','adapter.go'],{cwd:baseDir,env,stdio:'inherit'})
  command=out;args=[];base={command:baseBin,args:['-']}
  if(meta.module)dependencies[meta.module]=pins.gomod[meta.module]
 }else{
  const ext=meta.language==='python'?'py':'rb'
  const runner=fromRoot('harness',meta.language,`http-runner.${ext}`)
  args=[...rt.args,runner,path.join(sourceDir,`adapter.${ext}`),fromRoot('.cache/http-servers',meta.language)]
  base={command,args:[...rt.args,runner,'-']}
 }
 return {command,args,cwd:ROOT,env:meta.env,phases:meta.language==='go'?['boot','ready']:['boot','loaded','ready'],base:{...base,cwd:ROOT,version:rt.version},extra:{version:pins[target.ecosystem]?.[meta.module??packageName]??null,dependencies,...(meta.env?{settings:meta.env}:{})}}
}
