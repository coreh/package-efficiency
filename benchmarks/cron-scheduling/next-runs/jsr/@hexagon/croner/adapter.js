import { Cron } from '@hexagon/croner'
export const operation = ({ pattern, start, count }) => new Cron(pattern).nextRuns(count, new Date(start))
