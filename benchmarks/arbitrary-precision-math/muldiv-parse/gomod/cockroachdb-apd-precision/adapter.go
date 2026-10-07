package main

import (
	"github.com/cockroachdb/apd/v3"
)

var ctx = apd.BaseContext.WithPrecision(5000)

func operation(value any) any {
	pair := value.([]any)
	x, _, err := apd.NewFromString(pair[0].(string))
	if err != nil {
		panic(err)
	}
	y, _, err := apd.NewFromString(pair[1].(string))
	if err != nil {
		panic(err)
	}
	var p, q, r apd.Decimal
	if _, err := ctx.Mul(&p, x, y); err != nil {
		panic(err)
	}
	if _, err := ctx.QuoInteger(&q, x, y); err != nil {
		panic(err)
	}
	if _, err := ctx.Rem(&r, x, y); err != nil {
		panic(err)
	}
	return []string{p.String(), q.String(), r.String()}
}
