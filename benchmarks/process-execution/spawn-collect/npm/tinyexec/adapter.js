import { xSync } from 'tinyexec'
export const operation = ({ command, args }) => {
  const result = xSync(command, args)
  return { stdout: result.stdout, status: result.exitCode }
}
