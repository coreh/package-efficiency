package main

import wordwrap "github.com/mitchellh/go-wordwrap"

func operation(value any) any {
	in := value.(map[string]any)
	return wordwrap.WrapString(in["text"].(string), uint(in["width"].(float64)))
}
