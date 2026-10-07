package main

import "net/url"

func operation(value any) any {
	values, err := url.ParseQuery(value.(string))
	if err != nil {
		panic(err)
	}
	out := make(map[string]string, len(values))
	for k, v := range values {
		out[k] = v[0]
	}
	return out
}
