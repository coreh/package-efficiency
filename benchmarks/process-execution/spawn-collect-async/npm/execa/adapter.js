import { execa } from 'execa'
export const operation = async ({ command, args }) => {
  const result = await execa(command, args)
  return { stdout: result.stdout, status: result.exitCode }
}
