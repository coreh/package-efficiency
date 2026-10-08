import vm from 'node:vm'

export const operation = (script) => vm.runInNewContext(script)
