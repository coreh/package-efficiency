package main

import "net/http"

func operation(value any) any {
	cs, err := http.ParseCookie(value.(string))
	if err != nil {
		panic(err)
	}
	m := make(map[string]string, len(cs))
	for _, c := range cs {
		m[c.Name] = c.Value
	}
	return m
}
