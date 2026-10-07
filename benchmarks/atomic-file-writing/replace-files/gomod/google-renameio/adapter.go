package main

import (
	"io/fs"

	renameio "github.com/google/renameio/v2"
)

func operation(value any) any {
	for _, f := range value.(map[string]any)["files"].([]any) {
		file := f.(map[string]any)
		if err := renameio.WriteFile(file["path"].(string), []byte(file["content"].(string)), fs.FileMode(int(file["mode"].(float64)))); err != nil {
			panic(err)
		}
	}
	return nil
}
