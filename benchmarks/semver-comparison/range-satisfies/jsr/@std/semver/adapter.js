import { parse, parseRange, satisfies } from '@std/semver'
export const operation = ([version, range]) => satisfies(parse(version), parseRange(range))
