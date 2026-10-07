package main

import "math/big"

func operation(value any) any {
	n := int64(value.(float64))
	r := big.NewInt(1)
	var factor big.Int
	for i := int64(2); i <= n; i++ {
		r.Mul(r, factor.SetInt64(i))
	}
	return r.String()
}
