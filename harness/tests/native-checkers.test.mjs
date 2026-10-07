import {test} from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync,globSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {fromRoot} from '../../scripts/lib/util.mjs'
const data=JSON.parse(readFileSync(fromRoot('data/native-checks.json')))
for(const language of ['python','ruby','go'])test(`${language}: measured source bodies, validated checker and complete CPU/RSS samples`,()=>{
 const checker=data.checkers[language]
 assert.equal(checker.negativeControlRejected,true)
 assert.equal(checker.baseline.runs.length,11)
 const entries=Object.entries(data.adapters).filter(([,a])=>a.language===language)
 // The adapters of tasks that have results.
 const measured=globSync(fromRoot(`benchmarks/*/*/{builtin,pypi,rubygems,gomod}/*/adapter.${({python:'py',ruby:'rb',go:'go'})[language]}`)).filter(file=>{
  const [category,task]=file.slice(fromRoot('benchmarks').length+1).split('/')
  return globSync(fromRoot('results',category,task,'**/*.json')).length>0
 })
 // Every adapter of a measured task has a check on record. One its checker
 // rejects is recorded as rejected and has no figures. Adapters of tasks not
 // measured yet may be checked ahead of time, so there can be more checks.
 const missing=measured.map(file=>file.slice(fromRoot('benchmarks').length+1).split('/').slice(0,4).join('/')).filter(id=>!data.adapters[id]&&!data.rejected?.[id])
 assert.deepEqual(missing,[])
 for(const [id,a] of entries){
  const ext={python:'py',ruby:'rb',go:'go'}[language]
  const bytes=readFileSync(fromRoot('benchmarks',id,`adapter.${ext}`))
  assert.equal(a.sourceSha256,createHash('sha256').update(bytes).digest('hex'))
  assert.equal(a.runs.length,11)
  for(const r of a.runs)assert.ok(r.cpuMs>0&&r.timeMs>0&&r.peakRssMb>0)
 }
})
test('wait4 timing preserves child failures and measures actual CPU',()=>{
 const output=execFileSync('/opt/homebrew/bin/python3',[fromRoot('harness/checkers/time.py'),'/opt/homebrew/bin/python3','-c','sum(range(100000)); raise SystemExit(7)'],{encoding:'utf8'})
 const sample=JSON.parse(output);assert.equal(sample.status,7);assert.ok(sample.cpuMs>0);assert.ok(sample.peakRssMb>0)
})
