package main

import "github.com/munnerz/goautoneg"

func operation(value any) any {
	all := goautoneg.ParseAccept(value.(string))
	out := make([]goautoneg.Accept, 0, len(all))
	for _, a := range all {
		if a.Q > 0 {
			out = append(out, a)
		}
	}
	return out
}
