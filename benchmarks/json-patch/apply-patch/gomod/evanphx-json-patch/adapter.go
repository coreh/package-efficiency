package main

import jsonpatch "github.com/evanphx/json-patch/v5"

func operation(value any) any {
	input := value.(map[string]any)
	patch, err := jsonpatch.DecodePatch([]byte(input["patch"].(string)))
	if err != nil {
		panic(err)
	}
	out, err := patch.Apply([]byte(input["document"].(string)))
	if err != nil {
		return nil
	}
	return string(out)
}
