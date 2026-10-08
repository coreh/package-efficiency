package main

import pluralize "github.com/gertd/go-pluralize"

var client = pluralize.NewClient()

func operation(value any) any {
	words := value.([]any)
	out := make([]string, 0, 2*len(words))
	for _, w := range words {
		p := client.Plural(w.(string))
		out = append(out, p, client.Singular(p))
	}
	return out
}
