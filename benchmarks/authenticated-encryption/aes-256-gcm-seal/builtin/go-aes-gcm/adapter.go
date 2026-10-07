package main

import (
	"crypto/aes"
	"crypto/cipher"
)

type message struct{ key, nonce, aad, text []byte }

// Untimed, once per fixture: the four strings become byte slices.
func prepare(value any) any {
	in := value.(map[string]any)
	return &message{[]byte(in["key"].(string)), []byte(in["nonce"].(string)), []byte(in["aad"].(string)), []byte(in["text"].(string))}
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
	return gcm.Seal(nil, in.nonce, in.text, in.aad)
}
