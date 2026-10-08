require 'sqlite3'

def operation(rows)
  db = SQLite3::Database.new(':memory:')
  db.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)')
  db.transaction do
    stmt = db.prepare('INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)')
    rows.each { |row| stmt.execute(row) }
    stmt.close
  end
  result = db.execute('SELECT id, name, score, flag, note FROM items ORDER BY score, id')
  db.close
  result
end
