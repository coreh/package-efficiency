package main

import shellwords "github.com/mattn/go-shellwords"

func operation(value any) any {
	words, err := shellwords.Parse(value.(map[string]any)["line"].(string))
	if err != nil {
		panic(err)
	}
	if words == nil {
		words = []string{}
	}
	return words
}
