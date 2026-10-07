import { SemVer, compare } from 'semver'
export const operation = (versions) => {
  const parsed = versions.map((raw) => ({ raw, v: new SemVer(raw) }))
  parsed.sort((a, b) => compare(a.v, b.v))
  return parsed.map((p) => p.raw)
}
