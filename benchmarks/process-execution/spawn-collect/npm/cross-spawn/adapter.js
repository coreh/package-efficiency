import spawn from 'cross-spawn'
const options = { encoding: 'utf8' }
export const operation = ({ command, args }) => {
  const result = spawn.sync(command, args, options)
  return { stdout: result.stdout, status: result.status }
}
