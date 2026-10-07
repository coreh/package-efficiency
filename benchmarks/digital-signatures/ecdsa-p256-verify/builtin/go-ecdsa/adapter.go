package main

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/hex"
	"math/big"
)

func operation(value any) any {
	in := value.(map[string]any)
	pubBytes, _ := hex.DecodeString(in["publicKey"].(string))
	sig, _ := hex.DecodeString(in["signature"].(string))
	pub, err := ecdsa.ParseUncompressedPublicKey(elliptic.P256(), pubBytes)
	if err != nil {
		return false
	}
	digest := sha256.Sum256([]byte(in["message"].(string)))
	return ecdsa.Verify(pub, digest[:], new(big.Int).SetBytes(sig[:32]), new(big.Int).SetBytes(sig[32:]))
}
