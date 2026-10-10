package main

import "net/url"

type groups struct {
	keys, values, remove, read []string
}

func toStrings(raw any) []string {
	list := raw.([]any)
	out := make([]string, len(list))
	for i, v := range list {
		out[i] = v.(string)
	}
	return out
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	m := value.(map[string]any)
	return groups{toStrings(m["keys"]), toStrings(m["values"]), toStrings(m["remove"]), toStrings(m["read"])}
}

func operation(value any) any {
	in := value.(groups)
	vals := url.Values{}
	for i, k := range in.keys {
		vals.Add(k, in.values[i])
	}
	for _, k := range in.remove {
		vals.Del(k)
	}
	out := make([][]string, len(in.read))
	empty := []string{}
	for i, k := range in.read {
		if list, ok := vals[k]; ok {
			out[i] = list
		} else {
			out[i] = empty
		}
	}
	return out
}
