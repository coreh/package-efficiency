const collator = new Intl.Collator('en', { numeric: true })
export const operation = (list) => list.slice().sort(collator.compare)
