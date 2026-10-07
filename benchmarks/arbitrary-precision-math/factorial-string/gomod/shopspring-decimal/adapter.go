package main

import "github.com/shopspring/decimal"

func operation(value any) any {
	n := int64(value.(float64))
	r := decimal.NewFromInt(1)
	for i := int64(2); i <= n; i++ {
		r = r.Mul(decimal.NewFromInt(i))
	}
	return r.String()
}
