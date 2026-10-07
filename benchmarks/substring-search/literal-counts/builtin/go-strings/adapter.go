package main

import "strings"

func operation(value any) any {
	m := value.(map[string]any)
	text := m["text"].(string)
	needles := m["needles"].([]any)
	counts := make([]int, len(needles))
	for i, n := range needles {
		counts[i] = strings.Count(text, n.(string))
	}
	return counts
}
