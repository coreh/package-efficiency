package main

import "github.com/theory/jsonpath"

func operation(value any) any {
	input := value.(map[string]any)
	return jsonpath.MustParse(input["query"].(string)).Select(input["document"])
}
