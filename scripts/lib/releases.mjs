// One default release per package, plus any other versions listed for it under
// `activeVersions` in versions.json. Only listed versions get their own row in
// lists and rankings; this is opt-in per package, never automatic. Any other
// measured version, including a beta, stays in the package's history. A beta
// can be listed like any other version, but only by naming it.
export function releaseState(pins, ecosystem, name, version) {
 const primary=pins[ecosystem]?.[name] ?? null
 const additional=pins.activeVersions?.[ecosystem]?.[name] ?? []
 if(!Array.isArray(additional))throw new Error(`activeVersions.${ecosystem}.${name} must be an array`)
 if(additional.length&&!primary)throw new Error(`An active release line requires a default pin: ${ecosystem}/${name}`)
 const active=!primary||primary===version||additional.includes(version)
 return {primary,active,isDefault:!primary||primary===version}
}
export function releaseEntryId(ecosystem,name,version,state) {
 return `${ecosystem}/${name}${state.active&&!state.isDefault?`@${version}`:''}`
}
// Split list rows by active release without splitting the canonical package.
export function activeReleaseRows(packages) {
 return packages.flatMap(pkg=>[...new Set(pkg.appearances.map(a=>a.entry.version))].map(version=>({
  ...pkg,defaultVersion:pkg.version,version,appearances:pkg.appearances.filter(a=>a.entry.version===version),
 })))
}
