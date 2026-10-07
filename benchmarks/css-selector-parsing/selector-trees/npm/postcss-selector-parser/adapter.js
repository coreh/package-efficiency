import parser from 'postcss-selector-parser'
const processor = parser()
export const operation = (input) => processor.astSync(input)
