package main

import "github.com/agnivade/levenshtein"

func operation(value any) any {
	pair := value.([]any)
	query := pair[0].(string)
	best, bestDistance := 0, -1
	for i, w := range pair[1].([]any) {
		d := levenshtein.ComputeDistance(query, w.(string))
		if bestDistance < 0 || d < bestDistance {
			bestDistance, best = d, i
		}
	}
	return best
}
