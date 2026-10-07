// Validate the native HTTP results that are on record, including the common load policy.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {globSync,readFileSync} from 'node:fs'
import path from 'node:path'
import {fromRoot} from '../../scripts/lib/util.mjs'
const read=file=>JSON.parse(readFileSync(file))
const root=fromRoot('benchmarks/http-server/json-api')
const load=read(path.join(root,'task.json')).load
const actualRequests=Math.ceil(load.requestsPerRound/(load.workers*load.connections))*load.workers*load.connections
for(const file of globSync('{pypi,rubygems,gomod}/**/adapter.json',{cwd:root}).concat('builtin/go-net-http/adapter.json')){
 const adapter=read(path.join(root,file)),id=path.dirname(file)
 for(const runtime of adapter.runtimes)test(`${id} on ${runtime}: verified HTTP requests, full warm-up and complete measurements`,(t)=>{
  const matches=globSync(fromRoot('results/http-server/json-api',id,'*',`${runtime}.json`))
  // Results from an earlier harness are removed, so an entry may be waiting for its next measurement.
  if(matches.length===0)return t.skip('no result under the current harness yet')
  assert.equal(matches.length,1)
  const result=read(matches[0])
  assert.equal(result.status,'ok',result.error)
  assert.equal(result.runs.length,3)
  assert.equal(result.baseline.runs.length,3)
  assert.equal(result.baseline.runtime,`${runtime}-http`)
  for(const run of result.runs){
   assert.equal(run.rounds.length,3)
   assert.equal(run.warmupRounds.length,3)
   assert.ok(run.rssAfterLoadBytes>0)
   assert.ok(run.rounds.every(round=>round.cpuMs>0))
   for(const round of [...run.rounds,...run.warmupRounds]){
    assert.equal(round.requests,actualRequests)
    assert.ok(round.wallMs>0)
   }
  }
 })
}
