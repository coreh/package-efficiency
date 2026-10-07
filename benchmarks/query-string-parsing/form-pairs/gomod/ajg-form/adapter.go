package main

import "github.com/ajg/form"

func operation(value any) any {
	out := map[string]string{}
	if err := form.DecodeString(&out, value.(string)); err != nil {
		panic(err)
	}
	return out
}
