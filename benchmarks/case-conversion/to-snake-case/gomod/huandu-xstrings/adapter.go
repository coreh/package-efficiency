package main

import pkg "github.com/huandu/xstrings"

func operation(value any) any {
	return pkg.ToSnakeCase(value.(string))
}
