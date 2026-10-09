package main

import "github.com/mrunalp/fileutils"

func operation(value any) any {
	input := value.(map[string]any)
	if err := fileutils.CopyDirectory(input["from"].(string), input["to"].(string)); err != nil {
		panic(err)
	}
	return nil
}
