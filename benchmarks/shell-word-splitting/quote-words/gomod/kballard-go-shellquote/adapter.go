package main

import shellquote "github.com/kballard/go-shellquote"

func operation(value any) any {
	in := value.(map[string]any)["words"].([]any)
	words := make([]string, len(in))
	for i, w := range in {
		words[i] = w.(string)
	}
	return shellquote.Join(words...)
}
