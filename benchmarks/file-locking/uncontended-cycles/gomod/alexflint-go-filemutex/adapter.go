package main

import "github.com/alexflint/go-filemutex"

func operation(value any) any {
	input := value.(map[string]any)
	path := input["path"].(string)
	cycles := int(input["cycles"].(float64))
	held, freed := 0, 0
	for i := 0; i < cycles; i++ {
		a, err := filemutex.New(path)
		if err != nil {
			panic(err)
		}
		if err := a.Lock(); err != nil {
			panic(err)
		}
		b, err := filemutex.New(path)
		if err != nil {
			panic(err)
		}
		if b.TryLock() == nil {
			held++
			b.Unlock()
		}
		a.Unlock()
		if b.TryLock() == nil {
			freed++
			b.Unlock()
		}
		a.Close()
		b.Close()
	}
	return []int{held, freed}
}
