import wasm from 'node-sqlite3-wasm'

const { Database } = wasm

export const operation = (rows) => {
  const db = new Database(':memory:')
  db.exec('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)')
  db.exec('BEGIN')
  const insert = db.prepare('INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)')
  for (const row of rows) insert.run(row)
  insert.finalize()
  db.exec('COMMIT')
  const result = db.all('SELECT id, name, score, flag, note FROM items ORDER BY score, id')
  db.close()
  return result
}
