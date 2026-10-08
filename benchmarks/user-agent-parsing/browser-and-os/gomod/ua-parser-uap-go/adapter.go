package main

import "github.com/ua-parser/uap-go/uaparser"

var parser = uaparser.NewFromSaved()

func operation(value any) any {
	c := parser.Parse(value.(string))
	return map[string]string{"browser": c.UserAgent.Family, "version": c.UserAgent.Major, "os": c.Os.Family}
}
