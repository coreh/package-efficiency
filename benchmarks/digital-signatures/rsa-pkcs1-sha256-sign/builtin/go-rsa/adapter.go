package main

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/pem"
)

type prepared struct {
	key     *rsa.PrivateKey
	message []byte
}

// Untimed, once per fixture: the PKCS#1 PEM becomes an *rsa.PrivateKey (with
// its CRT values precomputed by the parser) and the message a byte slice.
func prepare(value any) any {
	in := value.(map[string]any)
	block, _ := pem.Decode([]byte(in["privateKey"].(string)))
	if block == nil {
		panic("no PEM block")
	}
	key, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		panic(err)
	}
	return prepared{key: key, message: []byte(in["message"].(string))}
}

func operation(value any) any {
	in := value.(prepared)
	digest := sha256.Sum256(in.message)
	signature, err := rsa.SignPKCS1v15(nil, in.key, crypto.SHA256, digest[:])
	if err != nil {
		panic(err)
	}
	return signature
}
