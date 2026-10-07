package main

import "github.com/ajg/form"

func operation(value any) any {
	in := value.(map[string]any)
	m := make(map[string]string, len(in))
	for k, v := range in {
		m[k] = v.(string)
	}
	s, err := form.EncodeToString(m)
	if err != nil {
		panic(err)
	}
	return s
}
