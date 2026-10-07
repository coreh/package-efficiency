// Requires the same ps/time process access as a real benchmark.
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {measureOperation} from '../supervisor.mjs'
test('full warm-up occurs in the measured process and is excluded from measured rounds', async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'full-warmup-'))
 try {
  const file=path.join(dir,'runner.mjs')
  await writeFile(file, `import {createInterface} from 'node:readline';
const send = (phase,extra={}) => console.log('@@'+JSON.stringify({phase,memory:{heapUsed:100},...extra}));
send('boot',{pid:process.pid});send('ready');let round=0;
for await (const line of createInterface({input:process.stdin})) {
 if(line==='exit') break;
 if(line==='settle'){send('settled');continue}
 const command=JSON.parse(line);round++;send('round',{operations:command.count,cpuMs:round,wallMs:command.count*1e-6,checksum:round});
}`)
  const result=await measureOperation({command:process.execPath,args:[file],cwd:dir,phases:['boot','ready'],load:{warmup:10,rounds:3,operationsPerRound:100,minRoundMs:1}})
  assert.equal(result.status,'ok',result.error)
  // Two probe rounds and the warm-up come first.
  assert.deepEqual(result.warmupRounds.map(r=>r.cpuMs),[4,5,6])
  assert.deepEqual(result.rounds.map(r=>r.cpuMs),[7,8,9])
  assert.ok(result.rounds.every(r=>r.operations===100))
 }finally{await rm(dir,{recursive:true,force:true})}
})
test('rounds are sized by time: batches shrink for slow operations and are capped at the task size for fast ones',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'supervisor-test-'))
 try {
  const file=path.join(dir,'runner.mjs')
  // Every call "takes" MS milliseconds; the runner reports the counts it was asked for.
  await writeFile(file, `import {createInterface} from 'node:readline';
const MS=Number(process.argv[2]);const send = (phase,extra={}) => console.log('@@'+JSON.stringify({phase,memory:{heapUsed:100},...extra}));
send('boot',{pid:process.pid});send('ready');
for await (const line of createInterface({input:process.stdin})) {
 if(line==='exit') break;
 if(line==='settle'){send('settled');continue}
 const command=JSON.parse(line);send('round',{operations:command.count,cpuMs:command.count*MS,wallMs:command.count*MS,checksum:command.count});
}`)
  const load={warmup:10000,rounds:2,operationsPerRound:100000,minRoundMs:250}
  const slow=await measureOperation({command:process.execPath,args:[file,'50'],cwd:dir,phases:['boot','ready'],load})
  assert.equal(slow.status,'ok',slow.error)
  // 50 ms a call: one call per batch.
  assert.ok(slow.rounds.every(r=>r.operations===1),JSON.stringify(slow.rounds))
  // 10 µs a call: a tenth of a 250 ms round is 2,500 calls.
  const middle=await measureOperation({command:process.execPath,args:[file,'0.01'],cwd:dir,phases:['boot','ready'],load})
  assert.ok(middle.rounds.every(r=>r.operations===2500),JSON.stringify(middle.rounds))
  // 0.1 µs a call: capped at the task's batch size.
  const fast=await measureOperation({command:process.execPath,args:[file,'0.0001'],cwd:dir,phases:['boot','ready'],load})
  assert.equal(fast.status,'ok',fast.error)
  assert.ok(fast.rounds.every(r=>r.operations===100000))
 }finally{await rm(dir,{recursive:true,force:true})}
})
