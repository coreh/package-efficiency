package main

import "github.com/go-openapi/jsonpointer"

func operation(value any) any {
	input := value.(map[string]any)
	document := input["document"]
	pointers := input["pointers"].([]any)
	out := make([]any, len(pointers))
	for i, p := range pointers {
		pointer, err := jsonpointer.New(p.(string))
		if err != nil {
			continue
		}
		v, _, err := pointer.Get(document)
		if err == nil {
			out[i] = v
		}
	}
	return out
}
