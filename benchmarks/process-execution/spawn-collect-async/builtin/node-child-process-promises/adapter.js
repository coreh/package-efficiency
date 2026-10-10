import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execFileAsync = promisify(execFile)
const options = { encoding: 'utf8' }
export const operation = async ({ command, args }) => {
  // The promise carries the child; its exit code is set once the promise has
  // resolved (a non-zero code rejects it).
  const running = execFileAsync(command, args, options)
  const { stdout } = await running
  return { stdout, status: running.child.exitCode }
}
