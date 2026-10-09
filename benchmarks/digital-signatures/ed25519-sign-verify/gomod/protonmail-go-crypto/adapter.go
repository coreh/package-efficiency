package main

import (
	"encoding/hex"

	"github.com/ProtonMail/go-crypto/openpgp/ed25519"
)

func operation(value any) any {
	in := value.(map[string]any)
	seed, _ := hex.DecodeString(in["seed"].(string))
	pub, _ := hex.DecodeString(in["publicKey"].(string))
	msg := []byte(in["message"].(string))
	priv := ed25519.NewPrivateKey(ed25519.PublicKey{Point: pub})
	if err := priv.UnmarshalByteSecret(seed); err != nil {
		panic(err)
	}
	sig, err := ed25519.Sign(priv, msg)
	if err != nil {
		panic(err)
	}
	if !ed25519.Verify(&ed25519.PublicKey{Point: pub}, msg, sig) {
		panic("signature did not verify")
	}
	return sig
}
