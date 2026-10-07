package main

import shlex "github.com/anmitsu/go-shlex"

func operation(value any) any {
	words, err := shlex.Split(value.(map[string]any)["line"].(string), true)
	if err != nil {
		panic(err)
	}
	if words == nil {
		words = []string{}
	}
	return words
}
