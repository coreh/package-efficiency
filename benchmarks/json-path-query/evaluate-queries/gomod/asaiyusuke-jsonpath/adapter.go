package main

import "github.com/AsaiYusuke/jsonpath"

func operation(value any) any {
	input := value.(map[string]any)
	out, err := jsonpath.Retrieve(input["query"].(string), input["document"])
	if err != nil {
		if _, missing := err.(jsonpath.ErrorMemberNotExist); missing {
			return []any{}
		}
		panic(err)
	}
	return out
}
