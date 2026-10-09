package main

import (
	"bytes"

	"github.com/jung-kurt/gofpdf"
)

type text struct {
	x, y float64
	s    string
}

type page struct {
	texts []text
	rules [][4]float64
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	var pages []page
	for _, p := range value.(map[string]any)["pages"].([]any) {
		m := p.(map[string]any)
		var pg page
		for _, t := range m["texts"].([]any) {
			tm := t.(map[string]any)
			pg.texts = append(pg.texts, text{tm["x"].(float64), tm["y"].(float64), tm["text"].(string)})
		}
		for _, r := range m["rules"].([]any) {
			a := r.([]any)
			pg.rules = append(pg.rules, [4]float64{a[0].(float64), a[1].(float64), a[2].(float64), a[3].(float64)})
		}
		pages = append(pages, pg)
	}
	return pages
}

func operation(value any) any {
	pdf := gofpdf.New("P", "pt", "A4", "")
	// The core fonts take cp1252 bytes; the input is UTF-8.
	tr := pdf.UnicodeTranslatorFromDescriptor("")
	pdf.SetFont("Helvetica", "", 10)
	for _, pg := range value.([]page) {
		pdf.AddPage()
		for _, t := range pg.texts {
			pdf.Text(t.x, t.y, tr(t.s))
		}
		for _, r := range pg.rules {
			pdf.Line(r[0], r[1], r[2], r[3])
		}
	}
	var out bytes.Buffer
	if err := pdf.Output(&out); err != nil {
		panic(err)
	}
	return out.Bytes()
}
