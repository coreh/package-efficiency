package main

import "gopkg.in/inf.v0"

func operation(value any) any {
	n := int64(value.(float64))
	r := inf.NewDec(1, 0)
	f := new(inf.Dec)
	for i := int64(2); i <= n; i++ {
		r.Mul(r, f.SetUnscaled(i))
	}
	return r.String()
}
