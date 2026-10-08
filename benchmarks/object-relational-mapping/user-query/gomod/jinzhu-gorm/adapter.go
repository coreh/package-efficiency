package main

import (
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

type User struct {
	ID    uint `gorm:"primary_key"`
	Name  string
	City  string
	Age   int
	Score int
}

type row struct {
	name, city string
	age, score int
}
type query struct {
	rows     []row
	skipCity string
	minAge   int
}

// The connection (one in-memory database) is opened once; each call creates
// the table, uses it and drops it. A pool of one connection keeps every
// statement on the same in-memory database.
var db = func() *gorm.DB {
	d, err := gorm.Open("sqlite3", ":memory:")
	if err != nil {
		panic(err)
	}
	d.DB().SetMaxOpenConns(1)
	return d
}()

func prepare(value any) any {
	m := value.(map[string]any)
	q := &query{skipCity: m["skipCity"].(string), minAge: int(m["minAge"].(float64))}
	for _, r := range m["rows"].([]any) {
		f := r.([]any)
		q.rows = append(q.rows, row{f[0].(string), f[1].(string), int(f[2].(float64)), int(f[3].(float64))})
	}
	return q
}

// This version of gorm has no batch insert: Create stores one object, so the
// objects are created one by one inside a transaction.
func operation(value any) any {
	q := value.(*query)
	if err := db.AutoMigrate(&User{}).Error; err != nil {
		panic(err)
	}
	tx := db.Begin()
	for _, r := range q.rows {
		u := User{Name: r.name, City: r.city, Age: r.age, Score: r.score}
		if err := tx.Create(&u).Error; err != nil {
			panic(err)
		}
	}
	if err := tx.Commit().Error; err != nil {
		panic(err)
	}
	var found []User
	if err := db.Where("age >= ?", q.minAge).Where("city <> ?", q.skipCity).Order("score desc, id asc").Find(&found).Error; err != nil {
		panic(err)
	}
	out := make([][]any, len(found))
	for i, u := range found {
		out[i] = []any{int(u.ID), u.Name, u.City, u.Age, u.Score}
	}
	if err := db.DropTable(&User{}).Error; err != nil {
		panic(err)
	}
	return out
}
