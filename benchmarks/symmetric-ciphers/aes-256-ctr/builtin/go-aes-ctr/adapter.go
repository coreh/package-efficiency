package main

import (
	"crypto/aes"
	"crypto/cipher"
)

type message struct{ key, iv, text []byte }

// Untimed, once per fixture: the three strings become byte slices.
func prepare(value any) any {
	in := value.(map[string]any)
	return &message{[]byte(in["key"].(string)), []byte(in["iv"].(string)), []byte(in["text"].(string))}
}

func operation(value any) any {
	in := value.(*message)
	block, err := aes.NewCipher(in.key)
	if err != nil {
		panic(err)
	}
	// The prepared plaintext is shared by every call: the ciphertext goes into a new slice.
	out := make([]byte, len(in.text))
	cipher.NewCTR(block, in.iv).XORKeyStream(out, in.text)
	return out
}
