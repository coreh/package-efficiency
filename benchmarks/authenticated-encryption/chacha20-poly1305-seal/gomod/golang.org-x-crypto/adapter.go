package main

import "golang.org/x/crypto/chacha20poly1305"

type message struct{ key, nonce, aad, text []byte }

// Untimed, once per fixture: the four strings become byte slices.
func prepare(value any) any {
	in := value.(map[string]any)
	return &message{[]byte(in["key"].(string)), []byte(in["nonce"].(string)), []byte(in["aad"].(string)), []byte(in["text"].(string))}
}

func operation(value any) any {
	in := value.(*message)
	aead, err := chacha20poly1305.New(in.key)
	if err != nil {
		panic(err)
	}
	return aead.Seal(nil, in.nonce, in.text, in.aad)
}
