package main

import pkg "github.com/iancoleman/strcase"

func operation(value any) any {
	return pkg.ToSnake(value.(string))
}
