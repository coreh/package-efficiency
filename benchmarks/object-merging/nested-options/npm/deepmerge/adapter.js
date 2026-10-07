import deepmerge from 'deepmerge'
export const operation = (sources) => deepmerge.all(sources)
