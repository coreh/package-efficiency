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
	out := [][]string{}
	m, err := regex.FindStringMatch(in["text"].(string))
	for err == nil && m != nil {
		gs := m.Groups()
		row := make([]string, 0, len(gs)-1)
		for _, g := range gs[1:] {
			row = append(row, g.String())
		}
		out = append(out, row)
		m, err = regex.FindNextMatch(m)
	}
	if err != nil {
		panic(err)
	}
	return out
}
