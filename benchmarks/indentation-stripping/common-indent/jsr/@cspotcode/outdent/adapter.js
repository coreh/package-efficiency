import { outdent } from '@cspotcode/outdent'
export const operation = value => outdent(Object.assign([value], { raw: [value] }))
