package main

import "github.com/gofrs/flock"

func operation(value any) any {
	input := value.(map[string]any)
	path := input["path"].(string)
	cycles := int(input["cycles"].(float64))
	held, freed := 0, 0
	for i := 0; i < cycles; i++ {
		a := flock.New(path)
		if err := a.Lock(); err != nil {
			panic(err)
		}
		b := flock.New(path)
		ok, err := b.TryLock()
		if err != nil {
			panic(err)
		}
		if ok {
			held++
			b.Unlock()
		}
		a.Unlock()
		ok, err = b.TryLock()
		if err != nil {
			panic(err)
		}
		if ok {
			freed++
			b.Unlock()
		}
	}
	return []int{held, freed}
}
