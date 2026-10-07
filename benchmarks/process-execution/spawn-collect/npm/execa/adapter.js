import { execaSync } from 'execa'
export const operation = ({ command, args }) => {
  const result = execaSync(command, args)
  return { stdout: result.stdout, status: result.exitCode }
}
