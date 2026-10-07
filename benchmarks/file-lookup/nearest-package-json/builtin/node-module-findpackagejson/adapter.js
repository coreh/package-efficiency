import { findPackageJSON } from 'node:module'

export const operation = ({ starts }) => starts.map((start) => findPackageJSON('.', start + '/'))
