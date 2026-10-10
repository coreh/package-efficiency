import { readdirpPromise } from 'readdirp'

export const operation = async ({ root }) =>
  (await readdirpPromise(root, { type: 'files_directories' })).map((entry) => entry.fullPath)
