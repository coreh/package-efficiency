package main

import (
	"errors"
	"time"

	"github.com/eapache/go-resiliency/breaker"
)

type input struct {
	threshold int
	openMs    int
	fail      []bool
}

func prepare(value any) any {
	m := value.(map[string]any)
	raw := m["fail"].([]any)
	fail := make([]bool, len(raw))
	for i, r := range raw {
		fail[i] = r.(bool)
	}
	return input{int(m["threshold"].(float64)), int(m["openMs"].(float64)), fail}
}

var errFailed = errors.New("failed")

func operation(value any) any {
	in := value.(input)
	b := breaker.New(in.threshold, 1, time.Duration(in.openMs)*time.Millisecond)
	out := make([]string, len(in.fail))
	ran := false
	failNow := false
	fn := func() error {
		ran = true
		if failNow {
			return errFailed
		}
		return nil
	}
	for i, f := range in.fail {
		ran = false
		failNow = f
		err := b.Run(fn)
		switch {
		case !ran:
			out[i] = "rejected"
		case err != nil:
			out[i] = "ran-failed"
		default:
			out[i] = "ran-ok"
		}
	}
	return out
}
