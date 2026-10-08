package main

import (
	"bytes"
	"encoding/hex"
	"strings"

	"rsc.io/pdf"
)

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	data := value.([]byte)
	r, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		panic(err)
	}
	n := r.NumPage()
	pages := make([]string, n)
	for i := 1; i <= n; i++ {
		var b strings.Builder
		for _, t := range r.Page(i).Content().Text {
			b.WriteString(t.S)
		}
		pages[i-1] = b.String()
	}
	return pages
}
