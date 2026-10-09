package main

import "github.com/dop251/goja"

func operation(value any) any {
	v, err := goja.New().RunString(value.(string))
	if err != nil {
		panic(err)
	}
	return v.Export()
}
