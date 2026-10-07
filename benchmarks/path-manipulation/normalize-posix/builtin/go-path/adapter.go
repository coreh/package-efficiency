package main
import "path"
func operation(value any) any { return path.Clean(value.(string)) }
