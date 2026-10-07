import { parseISO, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns'
export const operation = ({ from, to }) => {
  const a = parseISO(from), b = parseISO(to)
  return [differenceInHours(b, a), differenceInMinutes(b, a), differenceInSeconds(b, a)]
}
