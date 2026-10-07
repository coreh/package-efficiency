import { spawnSync } from 'node:child_process'
const options = { encoding: 'utf8' }
export const operation = ({ command, args }) => {
  const result = spawnSync(command, args, options)
  return { stdout: result.stdout, status: result.status }
}
