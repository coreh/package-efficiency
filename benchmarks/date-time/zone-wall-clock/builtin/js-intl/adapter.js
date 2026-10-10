// Untimed, once per fixture: the formatter for the zone is created.
export const prepare = ({ zone, instants }) => ({
  format: new Intl.DateTimeFormat('en-US', {
    timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }),
  instants,
})
const pad = (n, w = 2) => String(n).padStart(w, '0')
export const operation = ({ format, instants }) => instants.map((t) => {
  let y = 0, mo = 0, d = 0, h = 0, mi = 0, s = 0
  for (const { type, value } of format.formatToParts(t * 1000)) {
    if (type === 'year') y = Number(value)
    else if (type === 'month') mo = Number(value)
    else if (type === 'day') d = Number(value)
    else if (type === 'hour') h = Number(value)
    else if (type === 'minute') mi = Number(value)
    else if (type === 'second') s = Number(value)
  }
  return [`${pad(y, 4)}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}`, Date.UTC(y, mo - 1, d, h, mi, s) / 1000 - t]
})
