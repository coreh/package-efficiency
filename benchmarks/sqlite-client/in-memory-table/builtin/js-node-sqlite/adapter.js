import { DatabaseSync } from 'node:sqlite'

export const operation = (rows) => {
  const db = new DatabaseSync(':memory:')
  db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)')
  db.exec('BEGIN')
  const insert = db.prepare('INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)')
  for (const row of rows) insert.run(row[0], row[1], row[2], row[3], row[4])
  db.exec('COMMIT')
  const result = db.prepare('SELECT id, name, score, flag, note FROM items ORDER BY score, id').all()
  db.close()
  return result
}
