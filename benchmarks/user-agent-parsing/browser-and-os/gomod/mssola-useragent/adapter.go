package main

import "github.com/mssola/useragent"

func operation(value any) any {
	ua := useragent.New(value.(string))
	name, version := ua.Browser()
	return map[string]string{"browser": name, "version": version, "os": ua.OSInfo().Name}
}
