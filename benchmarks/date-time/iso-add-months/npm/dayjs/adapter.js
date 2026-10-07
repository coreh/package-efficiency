import dayjs from 'dayjs'
export const operation = ({ ts, months, days }) => dayjs(ts).add(months, 'month').add(days, 'day').format('YYYY-MM-DD HH:mm:ss')
