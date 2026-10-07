package main

import "gopkg.in/inf.v0"

func operation(value any) any {
	pair := value.([]any)
	x, ok := new(inf.Dec).SetString(pair[0].(string))
	if !ok {
		panic("bad number")
	}
	y, ok := new(inf.Dec).SetString(pair[1].(string))
	if !ok {
		panic("bad number")
	}
	p := new(inf.Dec).Mul(x, y)
	q := new(inf.Dec).QuoRound(x, y, 0, inf.RoundDown)
	r := new(inf.Dec).Sub(x, new(inf.Dec).Mul(q, y))
	return []string{p.String(), q.String(), r.String()}
}
