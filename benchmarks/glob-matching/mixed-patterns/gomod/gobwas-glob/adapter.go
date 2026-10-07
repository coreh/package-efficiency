package main

import "github.com/gobwas/glob"

var sep []rune // as installed: no separators

func operation(value any) any {
	in := value.(map[string]any)
	g := glob.MustCompile(in["pattern"].(string), sep...)
	paths := in["paths"].([]any)
	out := make([]any, len(paths))
	for i, p := range paths {
		out[i] = g.Match(p.(string))
	}
	return out
}
