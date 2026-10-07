package main

import "github.com/agext/levenshtein"

func operation(value any) any {
	pair := value.([]any)
	return levenshtein.Distance(pair[0].(string), pair[1].(string), nil)
}
