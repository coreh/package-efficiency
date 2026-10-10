package main

import "golang.org/x/crypto/salsa20"

type message struct {
	key         [32]byte
	nonce, text []byte
}

// Untimed, once per fixture: the three strings become bytes.
func prepare(value any) any {
	in := value.(map[string]any)
	m := &message{nonce: []byte(in["nonce"].(string)), text: []byte(in["text"].(string))}
	copy(m.key[:], in["key"].(string))
	return m
}

func operation(value any) any {
	in := value.(*message)
	out := make([]byte, len(in.text))
	salsa20.XORKeyStream(out, in.text, in.nonce, &in.key)
	return out
}
