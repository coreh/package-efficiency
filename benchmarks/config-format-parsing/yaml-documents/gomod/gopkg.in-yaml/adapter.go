package main

import yaml "gopkg.in/yaml.v2"

func convert(v any) any {
	switch x := v.(type) {
	case map[any]any:
		m := make(map[string]any, len(x))
		for k, e := range x {
			m[k.(string)] = convert(e)
		}
		return m
	case []any:
		for i, e := range x {
			x[i] = convert(e)
		}
		return x
	}
	return v
}

func operation(value any) any {
	var out any
	if err := yaml.Unmarshal([]byte(value.(string)), &out); err != nil {
		panic(err)
	}
	return convert(out)
}
