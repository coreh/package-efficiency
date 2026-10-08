package main

import "modernc.org/quickjs"

func operation(value any) any {
	vm, err := quickjs.NewVM()
	if err != nil {
		panic(err)
	}
	defer vm.Close()
	out, err := vm.Eval(value.(string), quickjs.EvalGlobal)
	if err != nil {
		panic(err)
	}
	return out
}
