package main
import "net/url"
func operation(value any) any { return url.QueryEscape(value.(string)) }
