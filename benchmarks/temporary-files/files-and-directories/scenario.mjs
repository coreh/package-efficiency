import { strict as assert } from 'node:assert'
import { lstatSync, readdirSync } from 'node:fs'
// The harness creates the two empty temporary roots in the task's scratch
// directory before each adapter process starts, and names that directory in
// BENCH_FILES. The system's temporary directory is never used.
const scratch = process.env.BENCH_FILES ?? '/BENCH_FILES-is-not-set'

export const files = { tree: [{ path: 'tmp-a/' }, { path: 'tmp-b/' }] }
const FILE_PREFIX = 'bench-', FILE_SUFFIX = '.dat', DIR_PREFIX = 'bench-dir-'
export const cases = [
  { input: { root: `${scratch}/tmp-a`, files: 240, dirs: 24, size: 1024, filePrefix: FILE_PREFIX, fileSuffix: FILE_SUFFIX, dirPrefix: DIR_PREFIX }, expected: null },
  { input: { root: `${scratch}/tmp-b`, files: 40, dirs: 120, size: 1024, filePrefix: FILE_PREFIX, fileSuffix: FILE_SUFFIX, dirPrefix: DIR_PREFIX }, expected: null },
]
const FIXED_TIME = Date.UTC(2026, 0, 1)

// An operation returns the paths of everything it created, files first and
// then directories, and has removed all of it when it returns. The check
// looks at the returned paths (the count, the names, uniqueness, location) and
// at the disk (the root must be empty again, and its modification time must
// have moved from the one the harness gave it, which proves entries were
// created in it). Contents cannot be read back, since they are gone.
function check(c, i, output) {
  const { root, files: nFiles, dirs: nDirs, filePrefix, fileSuffix, dirPrefix } = c.input
  assert.ok(Array.isArray(output), `fixture ${i}: the operation must return the list of paths it created`)
  assert.equal(output.length, nFiles + nDirs, `fixture ${i}: ${nFiles} files and ${nDirs} directories must be created`)
  assert.equal(new Set(output).size, output.length, `fixture ${i}: every path must be unique`)
  const fileNames = output.slice(0, nFiles), dirNames = output.slice(nFiles)
  const ok = (list, prefix, suffix) => list.every((p) => typeof p === 'string' && p.startsWith(`${root}/${prefix}`) && p.endsWith(suffix) && p.length > root.length + 1 + prefix.length + suffix.length && !p.slice(root.length + 1).includes('/'))
  assert.ok(ok(fileNames, filePrefix, fileSuffix), `fixture ${i}: the first ${nFiles} paths must be files named ${filePrefix}…${fileSuffix} directly in the root`)
  assert.ok(ok(dirNames, dirPrefix, ''), `fixture ${i}: the last ${nDirs} paths must be directories named ${dirPrefix}… directly in the root`)
  assert.deepEqual(readdirSync(root), [], `fixture ${i}: the temporary root must be empty after the operation`)
  assert.ok(lstatSync(root).mtimeMs !== FIXED_TIME, `fixture ${i}: nothing was created in the temporary root`)
}
export const verifyResults = (outputs) => {
  assert.equal(outputs?.length, cases.length, 'one output per fixture is required')
  cases.forEach((c, i) => check(c, i, outputs[i]))
}
export const verify = (operation) => cases.forEach((c, i) => check(c, i, operation(c.input)))
export const consume = (result) => result.length
