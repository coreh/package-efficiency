package main

import (
	"bytes"

	"gonum.org/v1/plot"
	"gonum.org/v1/plot/plotter"
	"gonum.org/v1/plot/vg"
	"gonum.org/v1/plot/vg/draw"
	"gonum.org/v1/plot/vg/vgsvg"
)

type chart struct {
	width, height float64
	x             []float64
	series        [][]float64
}

func floats(list []any) []float64 {
	out := make([]float64, len(list))
	for i, v := range list {
		out[i] = v.(float64)
	}
	return out
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	m := value.(map[string]any)
	c := chart{width: m["width"].(float64), height: m["height"].(float64), x: floats(m["x"].([]any))}
	for _, s := range m["series"].([]any) {
		c.series = append(c.series, floats(s.([]any)))
	}
	return c
}

func operation(value any) any {
	c := value.(chart)
	p := plot.New()
	for _, s := range c.series {
		pts := make(plotter.XYs, len(s))
		for j := range s {
			pts[j].X = c.x[j]
			pts[j].Y = s[j]
		}
		line, err := plotter.NewLine(pts)
		if err != nil {
			panic(err)
		}
		p.Add(line)
	}
	// vg lengths are points; 0.75 point is one CSS pixel.
	canvas := vgsvg.New(vg.Length(c.width*0.75), vg.Length(c.height*0.75))
	p.Draw(draw.New(canvas))
	var out bytes.Buffer
	if _, err := canvas.WriteTo(&out); err != nil {
		panic(err)
	}
	return out.String()
}
