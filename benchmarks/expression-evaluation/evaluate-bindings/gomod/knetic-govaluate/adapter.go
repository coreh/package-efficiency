package main

import (
	"math"

	"github.com/Knetic/govaluate"
)

var functions = map[string]govaluate.ExpressionFunction{
	"abs": func(args ...interface{}) (interface{}, error) { return math.Abs(args[0].(float64)), nil },
	"min": func(args ...interface{}) (interface{}, error) { return math.Min(args[0].(float64), args[1].(float64)), nil },
	"max": func(args ...interface{}) (interface{}, error) { return math.Max(args[0].(float64), args[1].(float64)), nil },
}

func operation(value any) any {
	input := value.(map[string]any)
	expression, err := govaluate.NewEvaluableExpressionWithFunctions(input["expr"].(string), functions)
	if err != nil {
		panic(err)
	}
	sets := input["vars"].([]any)
	out := make([]any, len(sets))
	for i, set := range sets {
		result, err := expression.Evaluate(set.(map[string]any))
		if err != nil {
			panic(err)
		}
		out[i] = result
	}
	return out
}
