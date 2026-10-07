package main

import pkg "github.com/gobuffalo/flect"

func operation(value any) any {
	return pkg.Underscore(value.(string))
}
