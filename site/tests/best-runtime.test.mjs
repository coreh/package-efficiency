import {test} from 'node:test'
import assert from 'node:assert/strict'
import {bestTaskEntries} from '../pages.mjs'
const entry=(id,cpu,memory)=>({id,grades:{cpu:{value:cpu,ratio:cpu,class:'A'},memory:{value:memory,ratio:memory,class:'A'}}})
const runtimes=[{id:'node',entries:[entry('npm/x',2,1)]},{id:'bun',entries:[entry('npm/x',1,3),entry('builtin/bun-only',.5,2)]},{id:'rust',entries:[entry('cargo/y',.25,.5)]}]
test('Best chooses by active metric and preserves all other metrics from that runtime',()=>{
 const cpu=bestTaskEntries(runtimes,'javascript','cpu').find(e=>e.id==='npm/x')
 assert.equal(cpu.selectedRuntime.id,'bun');assert.equal(cpu.grades.memory.value,3)
 const memory=bestTaskEntries(runtimes,'javascript','memory').find(e=>e.id==='npm/x')
 assert.equal(memory.selectedRuntime.id,'node');assert.equal(memory.grades.cpu.value,2)
})
test('All includes each package once across languages without dropping runtime-exclusive packages',()=>{
 const entries=bestTaskEntries(runtimes,'all','cpu')
 assert.deepEqual(entries.map(e=>e.id),['cargo/y','builtin/bun-only','npm/x'])
 assert.deepEqual(entries.map(e=>e.selectedRuntime.id),['rust','bun','bun'])
})
