import Chance from 'chance'
export const operation = ({ seed, count }) => {
  const chance = new Chance(seed)
  const records = new Array(count)
  for (let i = 0; i < count; i++) {
    records[i] = {
      name: chance.name(),
      email: chance.email(),
      street: chance.address(),
      date: chance.date({ year: 2010 }).toISOString().slice(0, 10),
    }
  }
  return records
}
