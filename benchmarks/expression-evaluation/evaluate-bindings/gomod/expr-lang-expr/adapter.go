package main

import "github.com/expr-lang/expr"

func operation(value any) any {
	input := value.(map[string]any)
	program, err := expr.Compile(input["expr"].(string))
	if err != nil {
		panic(err)
	}
	sets := input["vars"].([]any)
	out := make([]any, len(sets))
	for i, set := range sets {
		result, err := expr.Run(program, set)
		if err != nil {
			panic(err)
		}
		out[i] = result
	}
	return out
}
