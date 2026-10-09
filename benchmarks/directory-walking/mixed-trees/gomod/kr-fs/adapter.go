package main

import "github.com/kr/fs"

func operation(value any) any {
	root := value.(map[string]any)["root"].(string)
	paths := make([]string, 0, 1024)
	walker := fs.Walk(root)
	for walker.Step() {
		if err := walker.Err(); err != nil {
			panic(err)
		}
		paths = append(paths, walker.Path())
	}
	return paths
}
