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
 const command=JSON.parse(line);round++;send('round',{operations:command.count,cpuMs:round,wallMs:round,checksum:round});
}`)
  const result=await measureOperation({command:process.execPath,args:[file],cwd:dir,phases:['boot','ready'],load:{warmup:10,rounds:3,operationsPerRound:100,minRoundMs:1}})
  assert.equal(result.status,'ok',result.error)
  assert.deepEqual(result.warmupRounds.map(r=>r.cpuMs),[2,3,4])
  assert.deepEqual(result.rounds.map(r=>r.cpuMs),[5,6,7])
  assert.ok(result.rounds.every(r=>r.operations===100))
 }finally{await rm(dir,{recursive:true,force:true})}
})
