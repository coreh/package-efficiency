package main

import "github.com/mitchellh/copystructure"

func operation(value any) any {
	out, err := copystructure.Copy(value)
	if err != nil {
		panic(err)
	}
	return out
}
