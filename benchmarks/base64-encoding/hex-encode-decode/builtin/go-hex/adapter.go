package main

import (
	"encoding/hex"
	"encoding/json"
)

type byteList []byte

func (b byteList) MarshalJSON() ([]byte, error) {
	numbers := make([]int, len(b))
	for i, v := range b {
		numbers[i] = int(v)
	}
	return json.Marshal(numbers)
}

// Untimed, once per fixture: the list of byte values becomes a byte slice.
func prepare(value any) any {
	list := value.([]any)
	b := make([]byte, len(list))
	for i, v := range list {
		b[i] = byte(v.(float64))
	}
	return b
}

func operation(value any) any {
	text := hex.EncodeToString(value.([]byte))
	decoded, err := hex.DecodeString(text)
	if err != nil {
		panic(err)
	}
	return []any{text, byteList(decoded)}
}
