package main
import "path/filepath"
func operation(value any) any {
	p := value.([]any)
	r, _ := filepath.Rel(p[0].(string), p[1].(string))
	return r
}
