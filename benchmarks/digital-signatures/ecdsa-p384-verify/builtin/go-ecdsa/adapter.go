package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha512"
	"encoding/hex"
	"math/big"
)

type input struct{ pub, sig, message []byte }

// Untimed, once per fixture: hex becomes bytes and the message its UTF-8 bytes.
func prepare(value any) any {
	in := value.(map[string]any)
	pub, _ := hex.DecodeString(in["publicKey"].(string))
	sig, _ := hex.DecodeString(in["signature"].(string))
	return &input{pub, sig, []byte(in["message"].(string))}
}

func operation(value any) any {
	in := value.(*input)
	pub, err := ecdsa.ParseUncompressedPublicKey(elliptic.P384(), in.pub)
	if err != nil {
		return false
	}
	digest := sha512.Sum384(in.message)
	return ecdsa.Verify(pub, digest[:], new(big.Int).SetBytes(in.sig[:48]), new(big.Int).SetBytes(in.sig[48:]))
}
