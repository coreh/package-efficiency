package main

import "strings"

func operation(value any) any {
	m := value.(map[string]any)
	text := m["text"].(string)
	needle := m["needle"].(string)
	out := []int{}
	pos := 0
	for {
		i := strings.Index(text[pos:], needle)
		if i < 0 {
			break
		}
		out = append(out, pos+i)
		pos += i + len(needle)
	}
	return out
}
