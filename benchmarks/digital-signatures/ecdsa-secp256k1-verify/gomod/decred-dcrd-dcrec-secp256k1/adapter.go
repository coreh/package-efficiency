package main

import (
	"encoding/hex"

	"github.com/decred/dcrd/dcrec/secp256k1/v4"
	"github.com/decred/dcrd/dcrec/secp256k1/v4/ecdsa"
)

type input struct{ pub, sig, digest []byte }

// Untimed, once per fixture: hex becomes bytes.
func prepare(value any) any {
	in := value.(map[string]any)
	pub, _ := hex.DecodeString(in["publicKey"].(string))
	sig, _ := hex.DecodeString(in["signature"].(string))
	digest, _ := hex.DecodeString(in["digest"].(string))
	return &input{pub, sig, digest}
}

func operation(value any) any {
	in := value.(*input)
	pub, err := secp256k1.ParsePubKey(in.pub)
	if err != nil {
		return false
	}
	var r, s secp256k1.ModNScalar
	if r.SetByteSlice(in.sig[:32]) || s.SetByteSlice(in.sig[32:]) {
		return false
	}
	return ecdsa.NewSignature(&r, &s).Verify(in.digest, pub)
}
