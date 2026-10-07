package main

import (
	"github.com/cockroachdb/apd/v3"
)

var ctx = apd.BaseContext.WithPrecision(0)

func operation(value any) any {
	n := int64(value.(float64))
	r := apd.New(1, 0)
	var f apd.Decimal
	for i := int64(2); i <= n; i++ {
		f.SetInt64(i)
		if _, err := ctx.Mul(r, r, &f); err != nil {
			panic(err)
		}
	}
	return r.String()
}
