import sqlite3

def operation(rows):
    db = sqlite3.connect(':memory:')
    db.execute('CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)')
    with db:
        db.executemany('INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)', rows)
    result = db.execute('SELECT id, name, score, flag, note FROM items ORDER BY score, id').fetchall()
    db.close()
    return result
