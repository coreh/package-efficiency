import { deepMerge } from '@cross/deepmerge'
export const operation = (sources) => deepMerge(...sources)
