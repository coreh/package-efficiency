import { mkdirSync } from 'node:fs'
import * as tar from 'tar'

export const operation = ({ source, archive, target }) => {
  tar.c({ sync: true, file: archive, cwd: source }, ['.'])
  mkdirSync(target)
  tar.x({ sync: true, file: archive, cwd: target })
}
