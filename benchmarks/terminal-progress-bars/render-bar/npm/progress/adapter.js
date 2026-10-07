import ProgressBar from 'progress'

// A TTY-like stream kept in memory: only the last frame is remembered.
let last = ''
const stream = { isTTY: true, columns: 80, cursorTo() {}, clearLine() {}, write(s) { if (s.trim()) last = s } }

export function operation({ total, steps }) {
  last = ''
  const bar = new ProgressBar('[:bar] :percent', { total, stream, renderThrottle: 0 })
  for (let i = 0; i < steps; i++) bar.tick()
  return last
}
