package main

import "github.com/ohler55/ojg/jp"

func operation(value any) any {
	input := value.(map[string]any)
	out := jp.MustParseString(input["query"].(string)).Get(input["document"])
	if out == nil {
		return []any{}
	}
	return out
}
