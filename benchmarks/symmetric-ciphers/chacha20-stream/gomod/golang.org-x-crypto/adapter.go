package main

import "golang.org/x/crypto/chacha20"

type message struct{ key, nonce, text []byte }

// Untimed, once per fixture: the three strings become byte slices.
func prepare(value any) any {
	in := value.(map[string]any)
	return &message{[]byte(in["key"].(string)), []byte(in["nonce"].(string)), []byte(in["text"].(string))}
}

func operation(value any) any {
	in := value.(*message)
	c, err := chacha20.NewUnauthenticatedCipher(in.key, in.nonce)
	if err != nil {
		panic(err)
	}
	out := make([]byte, len(in.text))
	c.XORKeyStream(out, in.text)
	return out
}
