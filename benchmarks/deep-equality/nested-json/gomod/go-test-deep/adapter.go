package main
import "github.com/go-test/deep"
func operation(value any) any { p := value.([]any); return len(deep.Equal(p[0], p[1])) == 0 }
