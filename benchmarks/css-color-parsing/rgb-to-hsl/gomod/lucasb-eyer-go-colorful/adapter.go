package main

import colorful "github.com/lucasb-eyer/go-colorful"

func operation(value any) any {
	v := value.([]any)
	c := colorful.Color{R: v[0].(float64) / 255, G: v[1].(float64) / 255, B: v[2].(float64) / 255}
	h, s, l := c.Hsl()
	return []float64{h, s * 100, l * 100}
}
