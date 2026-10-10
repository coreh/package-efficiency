package main

import "github.com/google/uuid"

func operation(value any) any {
	count := int(value.(float64))
	ids := make([]string, count)
	for i := range ids {
		id, err := uuid.NewV7()
		if err != nil {
			panic(err)
		}
		ids[i] = id.String()
	}
	return ids
}
