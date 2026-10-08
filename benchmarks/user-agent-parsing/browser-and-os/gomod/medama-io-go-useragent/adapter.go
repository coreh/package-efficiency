package main

import "github.com/medama-io/go-useragent"

var parser = useragent.NewParser()

func operation(value any) any {
	a := parser.Parse(value.(string))
	return map[string]string{"browser": string(a.Browser()), "version": a.BrowserVersion(), "os": string(a.OS())}
}
