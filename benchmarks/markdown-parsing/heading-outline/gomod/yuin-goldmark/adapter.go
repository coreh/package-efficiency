package main

import (
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

var md = goldmark.New()

func operation(value any) any {
	src := []byte(value.(string))
	doc := md.Parser().Parse(text.NewReader(src))
	out := [][]any{}
	for n := doc.FirstChild(); n != nil; n = n.NextSibling() {
		if h, ok := n.(*ast.Heading); ok {
			out = append(out, []any{h.Level, string(h.Text(src))})
		}
	}
	return out
}
