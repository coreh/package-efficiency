package main

import "github.com/oklog/ulid/v2"

func operation(value any) any {
	count := int(value.(float64))
	ids := make([]string, count)
	for i := range ids {
		ids[i] = ulid.Make().String()
	}
	return ids
}
