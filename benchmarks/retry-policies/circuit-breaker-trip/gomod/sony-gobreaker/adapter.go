package main

import (
	"errors"
	"time"

	"github.com/sony/gobreaker/v2"
)

type input struct {
	threshold uint32
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
	return input{uint32(m["threshold"].(float64)), int(m["openMs"].(float64)), fail}
}

var errFailed = errors.New("failed")

func operation(value any) any {
	in := value.(input)
	cb := gobreaker.NewCircuitBreaker[any](gobreaker.Settings{
		ReadyToTrip: func(c gobreaker.Counts) bool { return c.ConsecutiveFailures >= in.threshold },
		Timeout:     time.Duration(in.openMs) * time.Millisecond,
		Interval:    0,
	})
	out := make([]string, len(in.fail))
	ran := false
	failNow := false
	fn := func() (any, error) {
		ran = true
		if failNow {
			return nil, errFailed
		}
		return nil, nil
	}
	for i, f := range in.fail {
		ran = false
		failNow = f
		_, err := cb.Execute(fn)
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
