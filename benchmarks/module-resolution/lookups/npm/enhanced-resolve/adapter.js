import fs from 'node:fs'
import enhanced from 'enhanced-resolve'

const { CachedInputFileSystem, ResolverFactory } = enhanced

export const operation = ({ base, specifiers }) => {
  const resolver = ResolverFactory.createResolver({
    fileSystem: new CachedInputFileSystem(fs, 4000),
    useSyncFileSystemCalls: true,
  })
  return specifiers.map((s) => resolver.resolveSync({}, base, s))
}
