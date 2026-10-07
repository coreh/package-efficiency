package main

import (
	"encoding/hex"
	"net/http"
)

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	return http.DetectContentType(value.([]byte))
}
