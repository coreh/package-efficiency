import { $ } from '@david/shell'
export const operation = async ({ command, args }) => {
  // stdout is inherited by default, which would write into the harness protocol: pipe it.
  const result = await $`${command} ${args}`.stdout('piped')
  return { stdout: result.stdout, status: result.code }
}
