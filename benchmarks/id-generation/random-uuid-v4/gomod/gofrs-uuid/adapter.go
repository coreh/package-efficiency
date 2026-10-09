package main

import "github.com/gofrs/uuid"

func operation(value any) any {
	id, err := uuid.NewV4()
	if err != nil {
		panic(err)
	}
	return id.String()
}
