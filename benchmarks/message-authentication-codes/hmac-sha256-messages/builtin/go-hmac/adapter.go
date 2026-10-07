package main

import (
	"crypto/hmac"
	"crypto/sha256"
)

func operation(value any) any {
	in := value.(map[string]any)
	mac := hmac.New(sha256.New, []byte(in["key"].(string)))
	mac.Write([]byte(in["text"].(string)))
	return [32]byte(mac.Sum(nil))
}
