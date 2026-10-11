import {execFileSync} from 'node:child_process'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {besideBin,fromRoot,nativeBin,readJson,sorbetPin} from './lib/util.mjs'
const lock=await readJson(fromRoot('toolchains/checkers.json')),sorbet=sorbetPin(lock)
const cutoff=Date.now()-lock.minReleaseAgeDays*86400000
for(const line of (await readFile(fromRoot('toolchains/checkers-requirements.txt'),'utf8')).trim().split('\n')) {
 const [name,version]=line.split('==')
 const response=await fetch(`https://pypi.org/pypi/${name}/${version}/json`)
 if(!response.ok)throw new Error(`Cannot verify release age for ${line}`)
 const data=await response.json()
 if(!data.urls.length || data.urls.some(file=>file.yanked || Date.parse(file.upload_time_iso_8601)>cutoff))throw new Error(`Release-age gate rejected ${line}`)
}
const gemsResponse=await fetch('https://rubygems.org/api/v1/versions/sorbet-static.json')
if(!gemsResponse.ok)throw new Error('Cannot verify Sorbet release age')
const gem=(await gemsResponse.json()).find(v=>v.number===lock.sorbet&&v.platform===sorbet.platform)
if(!gem || gem.prerelease || Date.parse(gem.created_at)>cutoff || gem.sha!==sorbet.sha256)throw new Error('Sorbet release-age/integrity gate rejected the pin')
const dir=fromRoot('.cache/checkers');await mkdir(dir,{recursive:true})
execFileSync(nativeBin('runtimes', 'cpython'),['-m','venv',`${dir}/python`],{stdio:'inherit'})
execFileSync(`${dir}/python/bin/pip`,['install','--disable-pip-version-check','--no-cache-dir','--only-binary=:all:','--no-deps','-r',fromRoot('toolchains/checkers-requirements.txt')],{stdio:'inherit'})
const url=`https://rubygems.org/downloads/sorbet-static-${lock.sorbet}-${sorbet.platform}.gem`
const response=await fetch(url);if(!response.ok)throw new Error(`${response.status}: ${url}`)
const bytes=Buffer.from(await response.arrayBuffer());if(createHash('sha256').update(bytes).digest('hex')!==sorbet.sha256)throw new Error('Sorbet checksum mismatch')
const file=`${dir}/sorbet.gem`;await writeFile(file,bytes)
execFileSync(besideBin('runtimes', 'ruby', 'gem'),['install','--local',file,'--install-dir',`${dir}/ruby`,'--no-document','--ignore-dependencies'],{stdio:'inherit'})
