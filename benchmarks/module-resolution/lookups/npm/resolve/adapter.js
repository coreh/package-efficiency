import process from 'node:process'
import resolve from 'resolve'

// As installed: extensions is ['.js'], so './data' does not find data.json
// (Node's require tries .js, .json and .node). The variant passes them.
const options = process.env.BENCH_RESOLVE === 'extensions' ? { extensions: ['.js', '.json', '.node'] } : {}
export const operation = ({ base, specifiers }) => specifiers.map((s) => resolve.sync(s, { basedir: base, ...options }))
