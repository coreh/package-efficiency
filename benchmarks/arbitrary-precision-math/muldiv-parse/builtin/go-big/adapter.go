package main

import "math/big"

func operation(value any) any {
	pair := value.([]any)
	var x, y, p, q, r big.Int
	x.SetString(pair[0].(string), 10)
	y.SetString(pair[1].(string), 10)
	p.Mul(&x, &y)
	q.QuoRem(&x, &y, &r)
	return []string{p.String(), q.String(), r.String()}
}
