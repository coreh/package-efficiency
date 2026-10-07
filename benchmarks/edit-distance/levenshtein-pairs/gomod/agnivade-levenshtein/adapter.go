package main

import "github.com/agnivade/levenshtein"

func operation(value any) any {
	pair := value.([]any)
	return levenshtein.ComputeDistance(pair[0].(string), pair[1].(string))
}
