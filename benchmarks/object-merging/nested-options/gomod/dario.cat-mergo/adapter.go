package main

import "dario.cat/mergo"

func operation(value any) any {
	result := map[string]any{}
	for _, source := range value.([]any) {
		if err := mergo.Merge(&result, source.(map[string]any), mergo.WithOverride); err != nil {
			panic(err)
		}
	}
	return result
}
