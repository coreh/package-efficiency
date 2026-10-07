package main

import "regexp"

var compiled = map[string]*regexp.Regexp{}

func operation(value any) any {
	in := value.(map[string]any)
	pattern := in["pattern"].(string)
	regex := compiled[pattern]
	if regex == nil {
		regex = regexp.MustCompile(pattern)
		compiled[pattern] = regex
	}
	all := regex.FindAllStringSubmatch(in["text"].(string), -1)
	out := make([][]string, len(all))
	for i, m := range all {
		out[i] = m[1:] // drop the whole-match slot
	}
	return out
}
