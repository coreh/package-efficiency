import dayjs from 'dayjs'
export const operation = ({ from, to }) => {
  const a = dayjs(from), b = dayjs(to)
  return [b.diff(a, 'hour'), b.diff(a, 'minute'), b.diff(a, 'second')]
}
