package main

import (
	"strings"

	"github.com/natefinch/atomic"
)

func operation(value any) any {
	for _, f := range value.(map[string]any)["files"].([]any) {
		file := f.(map[string]any)
		if err := atomic.WriteFile(file["path"].(string), strings.NewReader(file["content"].(string))); err != nil {
			panic(err)
		}
	}
	return nil
}
