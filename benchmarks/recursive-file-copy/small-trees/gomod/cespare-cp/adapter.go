package main

import "github.com/cespare/cp"

func operation(value any) any {
	input := value.(map[string]any)
	if err := cp.CopyAll(input["to"].(string), input["from"].(string)); err != nil {
		panic(err)
	}
	return nil
}
