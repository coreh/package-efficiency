package main

import (
	"os"
	"syscall"
)

func operation(value any) any {
	input := value.(map[string]any)
	path := input["path"].(string)
	cycles := int(input["cycles"].(float64))
	held, freed := 0, 0
	for i := 0; i < cycles; i++ {
		a, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0o600)
		if err != nil {
			panic(err)
		}
		if err := syscall.Flock(int(a.Fd()), syscall.LOCK_EX); err != nil {
			panic(err)
		}
		b, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0o600)
		if err != nil {
			panic(err)
		}
		if syscall.Flock(int(b.Fd()), syscall.LOCK_EX|syscall.LOCK_NB) == nil {
			held++
			syscall.Flock(int(b.Fd()), syscall.LOCK_UN)
		}
		syscall.Flock(int(a.Fd()), syscall.LOCK_UN)
		if syscall.Flock(int(b.Fd()), syscall.LOCK_EX|syscall.LOCK_NB) == nil {
			freed++
			syscall.Flock(int(b.Fd()), syscall.LOCK_UN)
		}
		a.Close()
		b.Close()
	}
	return []int{held, freed}
}
