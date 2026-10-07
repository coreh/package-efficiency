package main

import "github.com/gobwas/glob"

var globs = func() []*glob.Pattern {
	var sep []rune // as installed: no separators
	var out []*glob.Pattern
	for _, p := range []string{"src/**/*.{ts,tsx}", "**/*.test.js", "docs/**/*.md", "packages/*/src/**/*.ts", "*.json", "assets/img/*.{png,jpg,svg}", "**/__tests__/**/*", "lib/**/index.js", "**/file-?.txt", "config/[a-c]*.yml"} {
		out = append(out, glob.MustCompile(p, sep...))
	}
	return out
}()

func operation(value any) any {
	paths := value.(map[string]any)["paths"].([]any)
	out := make([]any, len(paths))
	for i, p := range paths {
		s := p.(string)
		m := false
		for _, g := range globs {
			if g.Match(s) {
				m = true
				break
			}
		}
		out[i] = m
	}
	return out
}
