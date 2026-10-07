// Check actual adapter bodies with annotation-only wrappers; each tool has its
// own baseline and grades. Run serially, without competing benchmarks.
import {execFileSync} from 'node:child_process'
import {globSync,readFileSync} from 'node:fs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {fromRoot,readJson,writeJson,median,loadConfig,machine} from './lib/util.mjs'
import {wrapPython,wrapRuby,goImports} from './lib/native-wrappers.mjs'
// --verify runs each adapter through its checker once and says which are
// rejected, without timing or recording anything.
const verify=process.argv.includes('--verify');let rejected=0
const config=await loadConfig(),lock=await readJson(fromRoot('toolchains/checkers.json'))
const work=fromRoot('.cache/native-checks');await mkdir(work,{recursive:true})
const goenv={...process.env,GOCACHE:fromRoot('.cache/go-build'),GOPATH:fromRoot('.cache/go-path'),GOMODCACHE:fromRoot('.cache/go-mod'),GOTOOLCHAIN:'local'}
const go=config.toolchains.go.bin
execFileSync(go,['build','-o',`${work}/go-types`,fromRoot('harness/checkers/go-types.go')],{env:goenv,stdio:'inherit'})
// Export data for every standard-library package an adapter imports.
const imported=[...new Set(globSync(fromRoot('benchmarks/*/*/builtin/*/adapter.go')).flatMap(file=>goImports(readFileSync(file,'utf8'))).filter(name=>!name.includes('.')))]
const exportsText=execFileSync(go,['list','-export','-deps','-f','{{.ImportPath}} {{.Export}}','encoding/json','html','reflect','net/http',...imported],{env:goenv,encoding:'utf8'})
const exports=Object.fromEntries(exportsText.trim().split('\n').map(l=>l.split(' ')).filter(([,p])=>p))
for(const moduleFile of globSync(fromRoot('benchmarks/http-server/json-api/gomod/*/go.mod'))){
 const text=execFileSync(go,['list','-export','-deps','-f','{{.ImportPath}} {{.Export}}','.'],{cwd:path.dirname(moduleFile),env:goenv,encoding:'utf8'})
 Object.assign(exports,Object.fromEntries(text.trim().split('\n').map(l=>l.split(' ')).filter(([,p])=>p)))
}
await writeJson(`${work}/exports.json`,exports)
const sorbet=fromRoot(`.cache/checkers/ruby/gems/sorbet-static-${lock.sorbet}-${lock.sorbetPlatform}/libexec/sorbet`)
if(!sorbet)throw new Error('Run node scripts/setup-checkers.mjs first')
const tools={
 python:{tool:'mypy',version:lock.mypy,ext:'py',command:[fromRoot('.cache/checkers/python/bin/python'),'-m','mypy','--strict','--no-incremental','--cache-dir=/dev/null','--python-version','3.12',
  // Adapters are plain scripts: an empty container with no declared element type, a value that may be None and a standard module newer than the stubs are not what is being measured.
  '--disable-error-code=var-annotated','--disable-error-code=union-attr','--disable-error-code=import-untyped','--disable-error-code=import-not-found'],baseline:'pass\n',bad:'def bad() -> int:\n    return "wrong"\n',notes:'mypy strict checks annotated adapter bodies and bundled typeshed, targeting Python 3.12 shared by CPython/PyPy. HTTP adapters use framework types where available; Waitress uses a minimal local API stub; dynamic request payloads have explicit Any boundaries. Fresh checker processes; no incremental cache. Checker runs on CPython, independently of the benchmark runtime.'},
 ruby:{tool:'sorbet',version:lock.sorbet,ext:'rb',command:[sorbet,'--no-config',fromRoot('harness/checkers/stdlib.rbi')],baseline:'# typed: strict\n',bad:'# typed: strict\nextend T::Sig\nsig { returns(Integer) }\ndef bad; "wrong"; end\n',notes:'Sorbet checks adapter bodies with explicit input/output signatures and bundled core RBI. JSON payload elements remain T.untyped; CGI API signatures are provided locally; JSON uses bundled RBI. HTTP routing uses a minimal local Roda RBI; its DSL, Rack input and JSON contents remain dynamic. Shared by CRuby and YJIT; checker runs as a native executable.'},
 go:{tool:'go-types',version:config.toolchains.go.version,ext:'go',command:[`${work}/go-types`,`${work}/exports.json`],baseline:'package main\n',bad:'package main\nfunc bad() int { return "wrong" }\n',notes:'go/types checks the actual adapter source, including parsing and loading prepared standard-library and framework export data. Preparing export data, compilation, code generation and linking are excluded.'},
}
async function once(args){const raw=execFileSync('/opt/homebrew/bin/python3',[fromRoot('harness/checkers/time.py'),...args],{encoding:'utf8',maxBuffer:16<<20,env:{...process.env,MYPYPATH:fromRoot('harness/checkers/stubs'),PYTHONPATH:fromRoot('.cache/http-servers/python')}});return JSON.parse(raw)}
async function measure(args){const runs=[];for(let i=0;i<11;i++){const r=await once(args);if(r.status!==0)throw new Error(r.stdout+'\n'+r.stderr);runs.push({cpuMs:r.cpuMs,timeMs:r.timeMs,peakRssMb:r.peakRssMb})}return {runs,...Object.fromEntries(['cpuMs','timeMs','peakRssMb'].map(k=>[k,median(runs.map(r=>r[k]))]))}}
const dependencyPins=await readFile(fromRoot('toolchains/checkers-requirements.txt'),'utf8')
const methodologySha256=createHash('sha256').update(await readFile(fromRoot('scripts/measure-native-checks.mjs'))).update(await readFile(fromRoot('scripts/lib/native-wrappers.mjs'))).update(await readFile(fromRoot('harness/checkers/http.rbi'))).update(await readFile(fromRoot('harness/checkers/stdlib.rbi'))).update(await readFile(fromRoot('harness/checkers/stubs/waitress/__init__.pyi'))).update(await readFile(fromRoot('toolchains/http-servers.json'))).digest('hex')
const previous=process.argv.includes('--missing') ? await readJson(fromRoot('data/native-checks.json'),null) : null
const result=previous ?? {machine:machine(),hostPython:config.runtimes.cpython.version,dependencyPins,measuredAt:new Date().toISOString(),memoryKind:'peak RSS of checker process',scoreBasis:'added process CPU ms * added peak RSS MB',checkers:{},adapters:{}}
for(const [language,t] of Object.entries(tools)){
 const sources=globSync(fromRoot(`benchmarks/*/*/{builtin,pypi,rubygems,gomod}/*/adapter.${t.ext}`))
 if(previous && previous.methodologySha256===methodologySha256 && previous.dependencyPins===dependencyPins && previous.checkers[language]?.version===t.version && sources.every(file=> {
   const id=path.relative(fromRoot('benchmarks'),path.dirname(file))
   return (previous.adapters[id]??previous.rejected?.[id])?.sourceSha256===createHash('sha256').update(readFileSync(file)).digest('hex')
 }))continue
 const dir=`${work}/${language}`;await mkdir(dir,{recursive:true})
 const base=`${dir}/baseline.${t.ext}`,bad=`${dir}/invalid.${t.ext}`
 await writeFile(base,t.baseline);await writeFile(bad,t.bad)
 if((await once([...t.command,bad])).status===0)throw new Error(`${t.tool} accepted deliberate type error`)
 if(!verify)result.checkers[language]={tool:t.tool,version:t.version,notes:t.notes,negativeControlRejected:true,baseline:await measure([...t.command,base])}
 for(const file of globSync(fromRoot(`benchmarks/*/*/{builtin,pypi,rubygems,gomod}/*/adapter.${t.ext}`))){
  const id=path.relative(fromRoot('benchmarks'),path.dirname(file));const source=await readFile(file,'utf8');let checked=source
  const http=id.startsWith('http-server/'),equality=id.startsWith('deep-equality/'),html=id.startsWith('html-escaping/')
  // The three original tasks keep their precise wrappers; every other task's
  // adapters get the general ones (scripts/lib/native-wrappers.mjs).
  const general=!http&&!equality&&!html&&!id.startsWith('stable-json-stringify/')
  if(general&&language==='python')checked=wrapPython(source)
  else if(general&&language==='ruby')checked=wrapRuby(source)
  else if(language==='python'&&!http){
   const jsonType='from typing import TypeAlias\nJSON: TypeAlias = None | bool | int | float | str | list["JSON"] | dict[str, "JSON"]\n'
   checked=(html?'':jsonType)+source.replace('def operation(value):',`def operation(value: ${html?'str':equality?'list[JSON]':'JSON'}) -> ${equality?'bool':'str'}:`)
  }
  if(!general&&language==='ruby'&&!http){
   checked='# typed: strict\nextend T::Sig\n'+source.replace('def operation(value)',`sig { params(value: ${html?'String':equality?'T::Array[T.untyped]':'T.untyped'}).returns(${equality?'T::Boolean':'String'}) }\ndef operation(value)`)
   if(!html&&!equality)checked=checked.replace('def sorted(value)','sig { params(value: T.untyped).returns(T.untyped) }\ndef sorted(value)')
  }
  if(language==='ruby'&&http)checked='# typed: strict\nextend T::Sig\n'+source.replace('def application','sig { returns(T.proc.params(env: T::Hash[String, T.untyped]).returns(T::Array[T.untyped])) }\ndef application')
  const adapterDir=`${dir}/${path.basename(path.dirname(file))}`;await mkdir(adapterDir,{recursive:true})
  const dest=`${adapterDir}/entry.${t.ext}`;await writeFile(dest,checked)
  const extra=language==='ruby'&&http?[fromRoot('harness/checkers/http.rbi')]:[]
  // An adapter the checker rejects (its result is not the type the wrapper
  // declares, say) is reported and left without a check; the rest go on.
  if(verify){const r=await once([...t.command,...extra,dest]);if(r.status!==0){rejected++;console.error(`${id}: ${(r.stdout+'\n'+r.stderr).trim().split('\n').slice(0,3).join(' | ').slice(0,300)}`)}continue}
  let measured
  try{measured=await measure([...t.command,...extra,dest])}catch(error){const why=String(error.message).trim().split('\n')[0].replaceAll(fromRoot(),'').slice(0,200);console.error(`${id}: not checked: ${why}`);delete result.adapters[id];(result.rejected??={})[id]={language,tool:t.tool,sourceSha256:createHash('sha256').update(source).digest('hex'),error:why};continue}
  if(result.rejected)delete result.rejected[id]
  const baseline=result.checkers[language].baseline
  result.adapters[id]={language,tool:t.tool,version:t.version,sourceSha256:createHash('sha256').update(source).digest('hex'),...measured,cpuMs:Math.max(0,measured.cpuMs-baseline.cpuMs),timeMs:Math.max(0,measured.timeMs-baseline.timeMs),memoryMb:Math.max(0,measured.peakRssMb-baseline.peakRssMb)}
  console.log(`${id}: ${result.adapters[id].cpuMs.toFixed(2)} ms CPU, ${result.adapters[id].memoryMb.toFixed(2)} MB added`)
  await writeJson(fromRoot('data/native-checks.json'),result)
 }
}

if(verify){console.error(`${rejected} rejected`);process.exit(rejected?1:0)}
result.methodologySha256=methodologySha256
await writeJson(fromRoot('data/native-checks.json'),result)
