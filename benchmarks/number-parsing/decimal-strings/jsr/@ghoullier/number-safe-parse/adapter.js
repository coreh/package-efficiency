import { numberSafeParse } from '@ghoullier/number-safe-parse'
export const operation = (strings) => strings.map((s) => numberSafeParse(s))
