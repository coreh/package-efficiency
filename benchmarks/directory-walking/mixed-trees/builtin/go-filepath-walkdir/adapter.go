package main

import (
	"io/fs"
	"path/filepath"
)

func operation(value any) any {
	root := value.(map[string]any)["root"].(string)
	paths := make([]string, 0, 1024)
	err := filepath.WalkDir(root, func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		paths = append(paths, path)
		return nil
	})
	if err != nil {
		panic(err)
	}
	return paths
}
