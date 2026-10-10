package main

import "gopkg.in/inf.v0"

func operation(value any) any {
	in := value.(map[string]any)
	amounts := in["amounts"].([]any)
	rates := in["rates"].([]any)
	block := int(in["block"].(float64))
	total := new(inf.Dec)
	out := make([]string, 1, len(amounts)/block+1)
	for start := 0; start < len(amounts); start += block {
		s := new(inf.Dec)
		for i := start; i < start+block; i++ {
			x, ok := new(inf.Dec).SetString(amounts[i].(string))
			if !ok {
				panic("bad number")
			}
			y, ok := new(inf.Dec).SetString(rates[i].(string))
			if !ok {
				panic("bad number")
			}
			s.Add(s, x.Mul(x, y))
		}
		out = append(out, new(inf.Dec).Round(s, 2, inf.RoundHalfEven).String())
		total.Add(total, s)
	}
	out[0] = new(inf.Dec).Round(total, 2, inf.RoundHalfEven).String()
	return out
}
