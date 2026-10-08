// Units. The data holds every time in milliseconds and every memory figure in
// bytes, whatever the task. A person reads µs for an operation, ms for a
// start, MB for memory: that conversion is here and nowhere else, so that a
// page, a label and the Markdown always show the same figure.
// A megabyte is 1,000,000 bytes and a KB is 1,000.

// A product or quotient of two decimal figures, without the stray last digit
// of binary arithmetic (0.0236321 * 1000 is 23.632099999999998).
const clean = (n) => Number(n.toPrecision(12))

const SHOWN = {
  'µs': (ms) => clean(ms * 1000),
  s: (ms) => clean(ms / 1000),
  MB: (bytes) => bytes / 1e6,
  KB: (bytes) => bytes / 1e3,
}
const STORED = {
  'µs': (us) => clean(us / 1000),
  s: (s) => clean(s * 1000),
  MB: (mb) => Math.round(mb * 1e6),
  KB: (kb) => Math.round(kb * 1e3),
}

// A stored figure as the number shown in `unit` (µs, s, MB or KB). Any other
// unit (ms, MB·s, a multiple) is shown as it is stored.
export const toDisplay = (value, unit) => (value === null || value === undefined || !SHOWN[unit] ? value : SHOWN[unit](value))
// The other way: a figure in `unit` as it is stored.
export const toStored = (value, unit) => (value === null || value === undefined || !STORED[unit] ? value : STORED[unit](value))

// The unit a task's CPU figure is shown in: a start takes milliseconds, an
// operation or a request microseconds. Only a startup task has `startupMs`.
export const cpuDisplayUnit = (metrics) => (metrics.startupMs != null ? 'ms' : 'µs')
// An entry's CPU figure and its memory, as shown.
export const cpuShown = (metrics) => toDisplay(metrics.cpuMs, cpuDisplayUnit(metrics))
export const megabytes = (bytes) => toDisplay(bytes, 'MB')
export const kilobytes = (bytes) => toDisplay(bytes, 'KB')
