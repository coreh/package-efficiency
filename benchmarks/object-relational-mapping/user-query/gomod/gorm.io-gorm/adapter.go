package main

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type User struct {
	ID    uint `gorm:"primaryKey"`
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
	d, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		panic(err)
	}
	sqlDB, err := d.DB()
	if err != nil {
		panic(err)
	}
	sqlDB.SetMaxOpenConns(1)
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

func operation(value any) any {
	q := value.(*query)
	if err := db.AutoMigrate(&User{}); err != nil {
		panic(err)
	}
	users := make([]User, len(q.rows))
	for i, r := range q.rows {
		users[i] = User{Name: r.name, City: r.city, Age: r.age, Score: r.score}
	}
	if err := db.Create(&users).Error; err != nil {
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
	if err := db.Migrator().DropTable(&User{}); err != nil {
		panic(err)
	}
	return out
}
