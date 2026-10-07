package main

import (
	"github.com/russross/blackfriday/v2"
)

func operation(value any) any {
	doc := blackfriday.New(blackfriday.WithExtensions(blackfriday.CommonExtensions)).Parse([]byte(value.(string)))
	out := [][]any{}
	doc.Walk(func(n *blackfriday.Node, entering bool) blackfriday.WalkStatus {
		if entering && n.Type == blackfriday.Heading {
			txt := ""
			for c := n.FirstChild; c != nil; c = c.Next {
				txt += string(c.Literal)
			}
			out = append(out, []any{n.Level, txt})
			return blackfriday.SkipChildren
		}
		return blackfriday.GoToNext
	})
	return out
}
