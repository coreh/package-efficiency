package main

import "github.com/karrick/godirwalk"

func operation(value any) any {
	root := value.(map[string]any)["root"].(string)
	paths := make([]string, 0, 1024)
	err := godirwalk.Walk(root, &godirwalk.Options{
		Callback: func(path string, entry *godirwalk.Dirent) error {
			paths = append(paths, path)
			return nil
		},
	})
	if err != nil {
		panic(err)
	}
	return paths
}
