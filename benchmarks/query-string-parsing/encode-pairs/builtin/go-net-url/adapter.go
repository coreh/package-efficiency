package main

import "net/url"

func operation(value any) any {
	in := value.(map[string]any)
	values := make(url.Values, len(in))
	for k, v := range in {
		values[k] = []string{v.(string)}
	}
	return values.Encode()
}
