import initSqlJs from 'sql.js'
import { drizzle } from 'drizzle-orm/sql-js'
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { and, asc, desc, gte, ne, sql } from 'drizzle-orm'

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  age: integer('age').notNull(),
  score: integer('score').notNull(),
})
// The database is opened once; every call creates the table, uses it, drops it.
const SQL = await initSqlJs()
const db = drizzle(new SQL.Database())

export const operation = ({ rows, skipCity, minAge }) => {
  db.run(sql`create table users (id integer primary key, name text not null, city text not null, age integer not null, score integer not null)`)
  db.insert(users).values(rows.map(([name, city, age, score]) => ({ name, city, age, score }))).run()
  const found = db.select().from(users)
    .where(and(gte(users.age, minAge), ne(users.city, skipCity)))
    .orderBy(desc(users.score), asc(users.id))
    .all()
  db.run(sql`drop table users`)
  return found.map((user) => [user.id, user.name, user.city, user.age, user.score])
}
