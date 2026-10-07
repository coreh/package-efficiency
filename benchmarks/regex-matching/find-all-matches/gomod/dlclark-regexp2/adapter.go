package main

import "github.com/dlclark/regexp2"

var compiled = map[string]*regexp2.Regexp{}

func operation(value any) any {
	in := value.(map[string]any)
	pattern := in["pattern"].(string)
	regex := compiled[pattern]
	if regex == nil {
		regex = regexp2.MustCompile(pattern, regexp2.None)
		compiled[pattern] = regex
	}
	out := []string{}
	m, err := regex.FindStringMatch(in["text"].(string))
	for err == nil && m != nil {
		out = append(out, m.String())
		m, err = regex.FindNextMatch(m)
	}
	if err != nil {
		panic(err)
	}
	return out
}
