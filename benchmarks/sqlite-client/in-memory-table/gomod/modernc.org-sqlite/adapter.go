package main

import (
	"database/sql"

	_ "modernc.org/sqlite"
)

type item struct {
	id    int64
	name  string
	score float64
	flag  int64
	note  *string
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	rows := value.([]any)
	out := make([]item, len(rows))
	for i, r := range rows {
		f := r.([]any)
		it := item{id: int64(f[0].(float64)), name: f[1].(string), score: f[2].(float64), flag: int64(f[3].(float64))}
		if s, ok := f[4].(string); ok {
			it.note = &s
		}
		out[i] = it
	}
	return out
}

func check(err error) {
	if err != nil {
		panic(err)
	}
}

func operation(value any) any {
	rows := value.([]item)
	db, err := sql.Open("sqlite", ":memory:")
	check(err)
	db.SetMaxOpenConns(1)
	_, err = db.Exec("CREATE TABLE items (id INTEGER PRIMARY KEY, name TEXT NOT NULL, score REAL NOT NULL, flag INTEGER NOT NULL, note TEXT)")
	check(err)
	tx, err := db.Begin()
	check(err)
	stmt, err := tx.Prepare("INSERT INTO items (id, name, score, flag, note) VALUES (?, ?, ?, ?, ?)")
	check(err)
	for _, r := range rows {
		_, err = stmt.Exec(r.id, r.name, r.score, r.flag, r.note)
		check(err)
	}
	check(stmt.Close())
	check(tx.Commit())
	rs, err := db.Query("SELECT id, name, score, flag, note FROM items ORDER BY score, id")
	check(err)
	out := make([][]any, 0, len(rows))
	for rs.Next() {
		var id, flag int64
		var name string
		var score float64
		var note sql.NullString
		check(rs.Scan(&id, &name, &score, &flag, &note))
		var n any
		if note.Valid {
			n = note.String
		}
		out = append(out, []any{id, name, score, flag, n})
	}
	check(rs.Err())
	check(rs.Close())
	check(db.Close())
	return out
}
