package main
import "github.com/google/go-cmp/cmp"
func operation(value any) any { p := value.([]any); return cmp.Equal(p[0], p[1]) }
