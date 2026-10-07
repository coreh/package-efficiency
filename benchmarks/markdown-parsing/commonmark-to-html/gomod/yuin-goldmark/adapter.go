package main

import (
	"bytes"

	"github.com/yuin/goldmark"
)

func operation(value any) any {
	var buf bytes.Buffer
	if err := goldmark.Convert([]byte(value.(string)), &buf); err != nil {
		panic(err)
	}
	return buf.String()
}
