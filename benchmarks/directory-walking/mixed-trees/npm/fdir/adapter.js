import { fdir } from 'fdir'

export const operation = ({ root }) => new fdir().withFullPaths().withDirs().crawl(root).sync()
