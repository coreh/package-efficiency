package main

import (
	"fmt"

	jwt "github.com/golang-jwt/jwt/v4"
)

func operation(value any) any {
	in := value.(map[string]any)
	secret := []byte(in["secret"].(string))
	parsed, err := jwt.Parse(in["token"].(string), func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok && ve.Errors&jwt.ValidationErrorExpired != 0 && ve.Errors&jwt.ValidationErrorSignatureInvalid == 0 {
			return map[string]any{"status": "expired", "claims": nil}
		}
		return map[string]any{"status": "invalid-signature", "claims": nil}
	}
	return map[string]any{"status": "valid", "claims": map[string]any(parsed.Claims.(jwt.MapClaims))}
}
