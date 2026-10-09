package main

import "github.com/otiai10/copy"

func operation(value any) any {
	input := value.(map[string]any)
	if err := copy.Copy(input["from"].(string), input["to"].(string)); err != nil {
		panic(err)
	}
	return nil
}
