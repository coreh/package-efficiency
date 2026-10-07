package main

import (
	"encoding/hex"

	"github.com/nats-io/nkeys"
)

func operation(value any) any {
	in := value.(map[string]any)
	seed, _ := hex.DecodeString(in["seed"].(string))
	msg := []byte(in["message"].(string))
	kp, err := nkeys.FromRawSeed(nkeys.PrefixByteUser, seed)
	if err != nil {
		panic(err)
	}
	sig, err := kp.Sign(msg)
	if err != nil {
		panic(err)
	}
	if err := kp.Verify(msg, sig); err != nil {
		panic(err)
	}
	return sig
}
