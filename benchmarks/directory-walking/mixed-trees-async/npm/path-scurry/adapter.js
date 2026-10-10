import { PathScurry } from 'path-scurry'

export const operation = ({ root }) => new PathScurry(root).walk({ withFileTypes: false })
