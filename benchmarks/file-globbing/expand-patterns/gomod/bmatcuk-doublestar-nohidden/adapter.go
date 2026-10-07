package main

import (
	"os"

	"github.com/bmatcuk/doublestar/v4"
)

func operation(value any) any {
	input := value.(map[string]any)
	fsys := os.DirFS(input["root"].(string))
	patterns := input["patterns"].([]any)
	out := make([][]string, len(patterns))
	for i, pattern := range patterns {
		matches, err := doublestar.Glob(fsys, pattern.(string), doublestar.WithNoHidden())
		if err != nil {
			panic(err)
		}
		out[i] = matches
	}
	return out
}
