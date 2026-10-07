package main

import regexp "rsc.io/binaryregexp"

var compiled = map[string]*regexp.Regexp{}

func operation(value any) any {
	in := value.(map[string]any)
	pattern := in["pattern"].(string)
	regex := compiled[pattern]
	if regex == nil {
		regex = regexp.MustCompile(pattern)
		compiled[pattern] = regex
	}
	matches := regex.FindAllString(in["text"].(string), -1)
	if matches == nil {
		return []string{}
	}
	return matches
}
