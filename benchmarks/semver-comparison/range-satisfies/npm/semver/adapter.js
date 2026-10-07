import semver from 'semver'
export const operation = ([version, range]) => semver.satisfies(version, range)
