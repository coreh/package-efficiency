import { parse, compare } from '@std/semver'
export const operation = (versions) => {
  const parsed = versions.map((raw) => ({ raw, v: parse(raw) }))
  parsed.sort((a, b) => compare(a.v, b.v))
  return parsed.map((p) => p.raw)
}
