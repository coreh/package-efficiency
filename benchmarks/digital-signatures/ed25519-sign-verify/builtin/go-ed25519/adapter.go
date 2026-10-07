package main

import (
	"crypto/ed25519"
	"encoding/hex"
)

func operation(value any) any {
	in := value.(map[string]any)
	seed, _ := hex.DecodeString(in["seed"].(string))
	pub, _ := hex.DecodeString(in["publicKey"].(string))
	msg := []byte(in["message"].(string))
	sig := ed25519.Sign(ed25519.NewKeyFromSeed(seed), msg)
	if !ed25519.Verify(ed25519.PublicKey(pub), msg, sig) {
		panic("signature did not verify")
	}
	return sig
}
