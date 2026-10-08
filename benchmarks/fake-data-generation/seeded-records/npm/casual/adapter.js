import casual from 'casual'
export const operation = ({ seed, count }) => {
  casual.seed(seed)
  const records = new Array(count)
  for (let i = 0; i < count; i++) {
    records[i] = { name: casual.full_name, email: casual.email, street: casual.address1, date: casual.date('YYYY-MM-DD') }
  }
  return records
}
