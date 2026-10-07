import { parseCronExpression } from '@p4sca1/cron-schedule'
export const operation = ({ pattern, start, count }) => parseCronExpression(pattern).getNextDates(count, new Date(start))
