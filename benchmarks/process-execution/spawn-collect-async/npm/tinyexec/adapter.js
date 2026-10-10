import { x } from 'tinyexec'
export const operation = async ({ command, args }) => {
  const result = await x(command, args)
  return { stdout: result.stdout, status: result.exitCode }
}
