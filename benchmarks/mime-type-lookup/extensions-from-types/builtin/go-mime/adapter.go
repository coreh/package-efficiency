package main
import "mime"
func operation(value any) any {
	exts, err := mime.ExtensionsByType(value.(string))
	if err != nil || len(exts) == 0 {
		return ""
	}
	return exts[0]
}
