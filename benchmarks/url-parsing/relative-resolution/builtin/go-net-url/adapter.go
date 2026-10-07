package main
import "net/url"
func operation(value any) any {
	pair := value.([]any)
	base, err := url.Parse(pair[0].(string))
	if err != nil { panic(err) }
	ref, err := url.Parse(pair[1].(string))
	if err != nil { panic(err) }
	return base.ResolveReference(ref).String()
}
