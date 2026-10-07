package main

import "mime"

func operation(value any) any {
	in := value.(map[string]any)
	raw := in["parameters"].(map[string]any)
	params := make(map[string]string, len(raw))
	for k, v := range raw {
		params[k] = v.(string)
	}
	return mime.FormatMediaType(in["type"].(string), params)
}
