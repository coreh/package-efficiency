package main

import (
	"os"

	"github.com/gobwas/glob"
)

var sep = func() []rune {
	if os.Getenv("BENCH_GOBWAS") == "separator" {
		return []rune{'/'}
	}
	return nil
}()

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
