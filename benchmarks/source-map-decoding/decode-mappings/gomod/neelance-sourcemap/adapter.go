package main

import (
	"bytes"
	"encoding/json"

	"github.com/neelance/sourcemap"
)

type mapping struct {
	GeneratedLine   int     `json:"generatedLine"`
	GeneratedColumn int     `json:"generatedColumn"`
	Source          string  `json:"source"`
	OriginalLine    int     `json:"originalLine"`
	OriginalColumn  int     `json:"originalColumn"`
	Name            *string `json:"name"`
}

// Not timed: the library reads a source map from JSON bytes.
func prepare(value any) any {
	b, err := json.Marshal(value)
	if err != nil {
		panic(err)
	}
	return b
}

func operation(value any) any {
	m, err := sourcemap.ReadFrom(bytes.NewReader(value.([]byte)))
	if err != nil {
		panic(err)
	}
	dm := m.DecodedMappings()
	out := make([]mapping, len(dm))
	for i, d := range dm {
		o := mapping{d.GeneratedLine, d.GeneratedColumn, d.OriginalFile, d.OriginalLine, d.OriginalColumn, nil}
		if d.OriginalName != "" {
			n := d.OriginalName
			o.Name = &n
		}
		out[i] = o
	}
	return out
}
