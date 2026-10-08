package main

import "github.com/gobuffalo/flect"

func operation(value any) any {
	words := value.([]any)
	out := make([]string, 0, 2*len(words))
	for _, w := range words {
		p := flect.Pluralize(w.(string))
		out = append(out, p, flect.Singularize(p))
	}
	return out
}
