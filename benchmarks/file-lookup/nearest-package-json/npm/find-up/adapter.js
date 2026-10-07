import { findUpSync } from 'find-up'

export const operation = ({ starts }) => starts.map((cwd) => findUpSync('package.json', { cwd }))
