package main

import pkg "github.com/naoina/go-stringutil"

func operation(value any) any {
	return pkg.ToSnakeCase(value.(string))
}
