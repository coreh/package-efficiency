package main

import (
	"fmt"

	jwt "github.com/form3tech-oss/jwt-go"
)

func operation(value any) any {
	in := value.(map[string]any)
	secret := []byte(in["secret"].(string))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims(in["claims"].(map[string]any)))
	signed, err := token.SignedString(secret)
	if err != nil {
		panic(err)
	}
	parsed, err := jwt.Parse(signed, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		panic(err)
	}
	return map[string]any{"claims": map[string]any(parsed.Claims.(jwt.MapClaims)), "token": signed}
}
