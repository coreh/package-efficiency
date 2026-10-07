package main

import "os/exec"

func operation(value any) any {
	input := value.(map[string]any)
	list := input["args"].([]any)
	args := make([]string, len(list))
	for i, arg := range list {
		args[i] = arg.(string)
	}
	cmd := exec.Command(input["command"].(string), args...)
	out, err := cmd.Output()
	if err != nil {
		panic(err)
	}
	return map[string]any{"stdout": string(out), "status": cmd.ProcessState.ExitCode()}
}
