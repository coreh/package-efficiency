import toposort from 'toposort'
export const operation = ({ nodes, edges }) => toposort.array(nodes, edges)
