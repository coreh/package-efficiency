import fse from 'fs-extra'

export const operation = ({ from, to }) => fse.copySync(from, to)
