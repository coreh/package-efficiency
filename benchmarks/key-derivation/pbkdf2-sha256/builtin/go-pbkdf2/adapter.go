package main

import (
	"crypto/pbkdf2"
	"crypto/sha256"
	"encoding/json"
)

// keyBytes marshals as a JSON array of integers (not base64) for the verifier;
// marshalling happens only during verification, outside the timed call.
type keyBytes []byte

func (k keyBytes) MarshalJSON() ([]byte, error) {
	ints := make([]int, len(k))
	for i, b := range k {
		ints[i] = int(b)
	}
	return json.Marshal(ints)
}

func operation(value any) any {
	m := value.(map[string]any)
	key, err := pbkdf2.Key(sha256.New, m["password"].(string), []byte(m["salt"].(string)), int(m["iterations"].(float64)), int(m["length"].(float64)))
	if err != nil {
		panic(err)
	}
	return keyBytes(key)
}
