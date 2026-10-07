package main

import "github.com/shopspring/decimal"

func operation(value any) any {
	pair := value.([]any)
	x, err := decimal.NewFromString(pair[0].(string))
	if err != nil {
		panic(err)
	}
	y, err := decimal.NewFromString(pair[1].(string))
	if err != nil {
		panic(err)
	}
	q, r := x.QuoRem(y, 0)
	return []string{x.Mul(y).String(), q.String(), r.String()}
}
