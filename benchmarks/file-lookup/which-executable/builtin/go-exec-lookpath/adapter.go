package main

import (
	"errors"
	"os"
	"os/exec"
)

func operation(value any) any {
	input := value.(map[string]any)
	// exec.LookPath reads PATH from the environment only.
	if err := os.Setenv("PATH", input["path"].(string)); err != nil {
		panic(err)
	}
	commands := input["commands"].([]any)
	found := make([]any, len(commands))
	for i, command := range commands {
		path, err := exec.LookPath(command.(string))
		if err == nil {
			found[i] = path
		} else if !errors.Is(err, exec.ErrNotFound) {
			panic(err)
		}
	}
	return found
}
