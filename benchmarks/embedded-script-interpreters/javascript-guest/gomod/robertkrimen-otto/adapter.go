package main

import "github.com/robertkrimen/otto"

func operation(value any) any {
	v, err := otto.New().Run(value.(string))
	if err != nil {
		panic(err)
	}
	out, err := v.Export()
	if err != nil {
		panic(err)
	}
	return out
}
