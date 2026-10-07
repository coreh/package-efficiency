package main

import (
	"crypto/aes"
	"crypto/cipher"
)

type message struct{ key, nonce, aad, sealed []byte }

// Untimed, once per fixture: the four strings become byte slices.
func prepare(value any) any {
	in := value.(map[string]any)
	s := in["sealed"].(string)
	sealed := make([]byte, 0, len(s))
	for _, r := range s {
		sealed = append(sealed, byte(r))
	}
	return &message{[]byte(in["key"].(string)), []byte(in["nonce"].(string)), []byte(in["aad"].(string)), sealed}
}

func operation(value any) any {
	in := value.(*message)
	block, err := aes.NewCipher(in.key)
	if err != nil {
		panic(err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		panic(err)
	}
	out, err := gcm.Open(make([]byte, 0, len(in.sealed)), in.nonce, in.sealed, in.aad)
	if err != nil {
		panic(err)
	}
	return out
}
