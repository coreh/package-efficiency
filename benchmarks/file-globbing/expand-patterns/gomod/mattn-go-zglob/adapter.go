package main

import "github.com/mattn/go-zglob"

func operation(value any) any {
	input := value.(map[string]any)
	root := input["root"].(string)
	patterns := input["patterns"].([]any)
	out := make([][]string, len(patterns))
	for i, pattern := range patterns {
		matches, err := zglob.Glob(root + "/" + pattern.(string))
		if err != nil {
			panic(err)
		}
		out[i] = matches
	}
	return out
}
