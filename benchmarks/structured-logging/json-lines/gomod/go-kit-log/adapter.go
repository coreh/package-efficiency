package main

import (
	"bytes"

	"github.com/go-kit/log"
	"github.com/go-kit/log/level"
)

var buf bytes.Buffer
var logger = level.NewFilter(log.With(log.NewJSONLogger(&buf), "ts", log.DefaultTimestampUTC), level.AllowInfo())

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		var l log.Logger
		switch r["level"].(string) {
		case "info":
			l = level.Info(logger)
		case "warn":
			l = level.Warn(logger)
		default:
			l = level.Error(logger)
		}
		l.Log("msg", r["message"], "user_id", int64(f["user_id"].(float64)), "route", f["route"], "duration_ms", f["duration_ms"], "cached", f["cached"], "region", f["region"])
	}
	out := buf.String()
	buf.Reset()
	return out
}
