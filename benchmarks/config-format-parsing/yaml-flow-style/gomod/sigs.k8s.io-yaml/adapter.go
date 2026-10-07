package main

import yaml "sigs.k8s.io/yaml"

func operation(value any) any {
	var out any
	if err := yaml.Unmarshal([]byte(value.(string)), &out); err != nil {
		panic(err)
	}
	return out
}
