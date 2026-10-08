import {test} from 'node:test'
import assert from 'node:assert/strict'
import {releaseState,releaseEntryId,activeReleaseRows} from '../../scripts/lib/releases.mjs'
import {versionsOf} from '../pages.mjs'
test('default full release, active earlier major, and beta remain distinct',()=>{
 const pins={npm:{example:'3.0.0'},activeVersions:{npm:{example:['2.5.0']}}}
 const main=releaseState(pins,'npm','example','3.0.0'),old=releaseState(pins,'npm','example','2.5.0'),beta=releaseState(pins,'npm','example','4.0.0-beta.1')
 assert.equal(main.isDefault,true);assert.equal(main.active,true)
 assert.equal(old.isDefault,false);assert.equal(old.active,true)
 assert.equal(beta.active,false)
 assert.notEqual(releaseEntryId('npm','example','3.0.0',main),releaseEntryId('npm','example','2.5.0',old))
 // A beta is only listed when it is named explicitly.
 assert.equal(releaseState({...pins,activeVersions:{npm:{example:['4.0.0-beta.1']}}},'npm','example','4.0.0-beta.1').active,true)
})
test('active releases split table measurements without splitting the package identity',()=>{
 const a=version=>({entry:{version},runtime:{id:'node'}})
 const pkg={name:'example',ecosystem:'npm',version:'3.0.0',appearances:[a('3.0.0'),a('2.5.0')],history:[a('4.0.0-beta.1')]}
 const rows=activeReleaseRows([pkg])
 assert.deepEqual(rows.map(p=>p.version),['3.0.0','2.5.0'])
 assert.ok(rows.every(p=>p.name==='example'&&p.defaultVersion==='3.0.0'&&p.appearances.length===1))
 assert.deepEqual(versionsOf(pkg),['4.0.0-beta.1','3.0.0','2.5.0'])
})

test('rendered package lists and version pages preserve both active lines and the default',async()=>{
 const {readFileSync}=await import('node:fs')
 const {packagePage,packagesPage}=await import('../pages.mjs')
 const data=JSON.parse(readFileSync(new URL('../../dist/data/http-server/json-api.json',import.meta.url)))
 const runtime=data.runtimes.find(r=>r.id==='node')
 // Any measured npm entry will do as the stand-in for the package under test.
 const base=runtime.entries.find(e=>e.name==='express')??runtime.entries.find(e=>e.ecosystem==='npm')
 const main={...base,name:'express',package:'express',title:'express',version:'3.0.0',id:'npm/express',defaultVersion:'3.0.0',activeRelease:true}
 const old={...main,version:'2.5.0',id:'npm/express@2.5.0'}
 const beta={...main,version:'4.0.0-beta.1',activeRelease:false}
 const pkg={ecosystem:'npm',name:'express',title:'express',version:'3.0.0',appearances:[main,old].map(entry=>({data,runtime,entry})),history:[{data,runtime,entry:beta}]}
 const model={index:{planned:[],compilers:data.compilers},repository:{url:'https://example.test/repo',branch:'main'},catalog:{groups:[],categories:[],byEcosystem:{},byCategory:new Map()},tasks:[data],packages:[pkg],runtimes:[runtime],categories:[{id:data.task.category,title:'HTTP servers',tasks:[data]}],packageOf:()=>pkg}
 const list=packagesPage(model)
 assert.match(list,/href="\/npm\/express\/2\.5\.0\/"/)
 assert.match(list,/<span class="ver">3\.0\.0<\/span>/)
 assert.match(list,/<span class="ver">2\.5\.0<\/span>/)
 assert.ok(!list.includes('4.0.0-beta.1'))
 const primary=packagePage(pkg,model)
 assert.ok(primary.includes('/npm/express.cpu.svg'))
 assert.ok(!primary.includes('/npm/express@2.5.0.cpu.svg'))
 const secondary=packagePage(pkg,model,'2.5.0')
 assert.ok(secondary.includes('/npm/express@2.5.0.cpu.svg'))
 assert.ok(!secondary.includes('/npm/express@2.5.0@2.5.0'))
 assert.match(secondary,/A second current release line, measured with the default/)
 const prerelease=packagePage(pkg,model,'4.0.0-beta.1')
 assert.match(prerelease,/It is not in the rankings/)
})
