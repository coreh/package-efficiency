package main

import (
	jose "gopkg.in/square/go-jose.v2"
	"gopkg.in/square/go-jose.v2/jwt"
)

func operation(value any) any {
	in := value.(map[string]any)
	secret := []byte(in["secret"].(string))
	signer, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.HS256, Key: secret}, (&jose.SignerOptions{}).WithType("JWT"))
	if err != nil {
		panic(err)
	}
	token, err := jwt.Signed(signer).Claims(in["claims"]).CompactSerialize()
	if err != nil {
		panic(err)
	}
	parsed, err := jwt.ParseSigned(token)
	if err != nil {
		panic(err)
	}
	var claims map[string]any
	if err := parsed.Claims(secret, &claims); err != nil {
		panic(err)
	}
	return map[string]any{"claims": claims, "token": token}
}
