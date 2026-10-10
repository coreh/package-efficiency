package main

import "github.com/shopspring/decimal"

func operation(value any) any {
	in := value.(map[string]any)
	amounts := in["amounts"].([]any)
	rates := in["rates"].([]any)
	block := int(in["block"].(float64))
	total := decimal.Zero
	out := make([]string, 1, len(amounts)/block+1)
	for start := 0; start < len(amounts); start += block {
		s := decimal.Zero
		for i := start; i < start+block; i++ {
			x, err := decimal.NewFromString(amounts[i].(string))
			if err != nil {
				panic(err)
			}
			y, err := decimal.NewFromString(rates[i].(string))
			if err != nil {
				panic(err)
			}
			s = s.Add(x.Mul(y))
		}
		out = append(out, s.RoundBank(2).String())
		total = total.Add(s)
	}
	out[0] = total.RoundBank(2).String()
	return out
}
