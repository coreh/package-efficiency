package main

import "maps"

func operation(value any) any {
	result := map[string]any{}
	for _, source := range value.([]any) {
		maps.Copy(result, source.(map[string]any))
	}
	return result
}
