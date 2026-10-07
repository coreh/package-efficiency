package main

import "github.com/agext/levenshtein"

func operation(value any) any {
	pair := value.([]any)
	query := pair[0].(string)
	best, bestDistance := 0, -1
	for i, w := range pair[1].([]any) {
		d := levenshtein.Distance(query, w.(string), nil)
		if bestDistance < 0 || d < bestDistance {
			bestDistance, best = d, i
		}
	}
	return best
}
