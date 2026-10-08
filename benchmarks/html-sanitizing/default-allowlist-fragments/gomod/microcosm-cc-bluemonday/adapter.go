package main

import "github.com/microcosm-cc/bluemonday"

var policy = bluemonday.UGCPolicy()

func operation(value any) any {
	return policy.Sanitize(value.(string))
}
