package main
import (
	"strings"
	"github.com/subosito/gotenv"
)
func operation(value any) any {
	out, err := gotenv.StrictParse(strings.NewReader(value.(string)))
	if err != nil { panic(err) }
	return map[string]string(out)
}
