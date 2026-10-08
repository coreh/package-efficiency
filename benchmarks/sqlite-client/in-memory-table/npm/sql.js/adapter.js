import initSqlJs from 'sql.js'

const SQL = await initSqlJs()

export const operation = (rows) => {
  const db = new SQL.Database()
  db.run('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)')
  db.run('BEGIN')
  const insert = db.prepare('INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)')
  for (const row of rows) insert.run(row)
  insert.free()
  db.run('COMMIT')
  const result = db.exec('SELECT id, name, score, flag, note FROM items ORDER BY score, id')
  db.close()
  return result[0].values
}
