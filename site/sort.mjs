// Graded columns compare class first because task thresholds can differ, then
// relative cost. Ungraded numeric/text columns retain their original behavior.
// `field` picks one figure of a cell that holds several (value, time, memory,
// score); without it, or with "grade", a graded cell sorts by class.
// One collator for every comparison: making one per call, as localeCompare
// with options does, is what made sorting thousands of names slow.
const collator = new Intl.Collator('en', { numeric: true })

export function compareCells(a, b, { numeric, descending = false, field }) {
  if (field && field !== 'grade') {
    const absent = (c) => c.dataset[field] === '' || c.dataset[field] === undefined
    if (absent(a) || absent(b)) return Number(absent(a)) - Number(absent(b))
    return (descending ? -1 : 1) * (Number(a.dataset[field]) - Number(b.dataset[field]))
  }
  const missing = (c) => numeric && (c.dataset.v === '' || c.dataset.v === undefined)
  if (missing(a) || missing(b)) return Number(missing(a)) - Number(missing(b))
  const direction = descending ? -1 : 1
  if (a.dataset.grade !== undefined && b.dataset.grade !== undefined) {
    const byClass = Number(a.dataset.grade) - Number(b.dataset.grade)
    if (byClass) return direction * byClass
  }
  const comparison = numeric
    ? Number(a.dataset.v) - Number(b.dataset.v)
    : collator.compare(a.textContent.trim().toLowerCase(), b.textContent.trim().toLowerCase())
  return direction * comparison
}

// Match columns by meaning: Best/All insert extra columns, and checker names
// vary by language. Keep distinct TypeScript compiler choices when available.
export function sortColumnKey(text) {
  const label = text.trim().toLowerCase().replace(/\s+/g, ' ')
  if (label.startsWith('cargo check') && label.includes('first run')) return 'cargo-cold-cpu'
  if (label.startsWith('type check') || label.startsWith('cargo check')) {
    if (/\btsgo\b/.test(label)) return 'types:tsgo'
    if (/\btsc\b/.test(label)) return 'types:tsc'
    return 'types'
  }
  if (label === 'cpu' || label.startsWith('cpu per ')) return 'cpu'
  return label
}

export function matchingSortColumn(keys, wanted) {
  const exact = keys.indexOf(wanted)
  if (exact !== -1) return exact
  if (wanted === 'types' || wanted.startsWith('types:')) {
    for (const fallback of ['types', 'types:tsgo', 'types:tsc']) {
      const index = keys.indexOf(fallback)
      if (index !== -1) return index
    }
  }
  return -1
}
