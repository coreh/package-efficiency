import { faker } from '@faker-js/faker'
export const operation = ({ seed, count }) => {
  faker.seed(seed)
  const records = new Array(count)
  for (let i = 0; i < count; i++) {
    records[i] = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      street: faker.location.streetAddress(),
      date: faker.date.between({ from: '2000-01-01T00:00:00Z', to: '2019-12-31T00:00:00Z' }).toISOString().slice(0, 10),
    }
  }
  return records
}
