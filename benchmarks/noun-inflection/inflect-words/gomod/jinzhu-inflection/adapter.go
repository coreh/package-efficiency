package main

import "github.com/jinzhu/inflection"

func operation(value any) any {
	words := value.([]any)
	out := make([]string, 0, 2*len(words))
	for _, w := range words {
		p := inflection.Plural(w.(string))
		out = append(out, p, inflection.Singular(p))
	}
	return out
}
