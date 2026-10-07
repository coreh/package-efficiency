package main

import pkg "github.com/stoewer/go-strcase"

func operation(value any) any {
	return pkg.SnakeCase(value.(string))
}
