import { parseISO, add, format } from 'date-fns'
export const operation = ({ ts, months, days }) => format(add(parseISO(ts), { months, days }), 'yyyy-MM-dd HH:mm:ss')
