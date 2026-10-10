package main

import "github.com/cockroachdb/apd/v3"

// Precision 34 holds every value here and lets Quantize to exponent -2 work;
// BaseContext rounds half up by default, so the rounding is set explicitly.
var ctx = func() *apd.Context {
	c := apd.BaseContext.WithPrecision(34)
	c.Rounding = apd.RoundHalfEven
	return c
}()

func must(_ apd.Condition, err error) {
	if err != nil {
		panic(err)
	}
}

func cents(x *apd.Decimal) string {
	var r apd.Decimal
	must(ctx.Quantize(&r, x, -2))
	return r.String()
}

func operation(value any) any {
	in := value.(map[string]any)
	amounts := in["amounts"].([]any)
	rates := in["rates"].([]any)
	block := int(in["block"].(float64))
	var total apd.Decimal
	out := make([]string, 1, len(amounts)/block+1)
	for start := 0; start < len(amounts); start += block {
		var s apd.Decimal
		for i := start; i < start+block; i++ {
			x, _, err := apd.NewFromString(amounts[i].(string))
			if err != nil {
				panic(err)
			}
			y, _, err := apd.NewFromString(rates[i].(string))
			if err != nil {
				panic(err)
			}
			var p apd.Decimal
			must(ctx.Mul(&p, x, y))
			must(ctx.Add(&s, &s, &p))
		}
		out = append(out, cents(&s))
		must(ctx.Add(&total, &total, &s))
	}
	out[0] = cents(&total)
	return out
}
