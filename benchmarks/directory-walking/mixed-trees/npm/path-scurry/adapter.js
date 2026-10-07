import { PathScurry } from 'path-scurry'

export const operation = ({ root }) => new PathScurry(root).walkSync({ withFileTypes: false })
