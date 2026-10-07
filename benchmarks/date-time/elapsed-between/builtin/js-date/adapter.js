export const operation = ({ from, to }) => {
  const d = new Date(to).getTime() - new Date(from).getTime()
  return [Math.trunc(d / 3600000), Math.trunc(d / 60000), Math.trunc(d / 1000)]
}
