package main

import "mime"

func operation(value any) any {
	mediaType, params, err := mime.ParseMediaType(value.(string))
	if err != nil {
		panic(err)
	}
	return map[string]any{"type": mediaType, "parameters": params}
}
