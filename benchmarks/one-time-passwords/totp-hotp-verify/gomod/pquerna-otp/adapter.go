package main

import (
	"time"

	"github.com/pquerna/otp/hotp"
	"github.com/pquerna/otp/totp"
)

type request struct {
	secret, code  string
	time, counter int64
}

// Untimed, once per fixture: the JSON object becomes a typed record.
func prepare(value any) any {
	in := value.(map[string]any)
	return &request{
		secret:  in["secret"].(string),
		code:    in["code"].(string),
		time:    int64(in["time"].(float64)),
		counter: int64(in["counter"].(float64)),
	}
}

func operation(value any) any {
	in := value.(*request)
	at := time.Unix(in.time, 0)
	h, err := hotp.GenerateCode(in.secret, uint64(in.counter))
	if err != nil {
		panic(err)
	}
	t, err := totp.GenerateCode(in.secret, at)
	if err != nil {
		panic(err)
	}
	// totp.ValidateOpts defaults (SHA-1, 6 digits, 30 s) with Skew 1: one step each way.
	ok, err := totp.ValidateCustom(in.code, in.secret, at, totp.ValidateOpts{Period: 30, Skew: 1, Digits: 6})
	if err != nil {
		panic(err)
	}
	return []any{h, t, ok}
}
