package main

import (
	"bytes"
	"log/slog"
)

var buf bytes.Buffer
var logger = slog.New(slog.NewJSONHandler(&buf, nil))

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		msg := r["message"].(string)
		args := []any{"user_id", int64(f["user_id"].(float64)), "route", f["route"].(string), "duration_ms", f["duration_ms"].(float64), "cached", f["cached"].(bool), "region", f["region"].(string)}
		switch r["level"].(string) {
		case "info":
			logger.Info(msg, args...)
		case "warn":
			logger.Warn(msg, args...)
		default:
			logger.Error(msg, args...)
		}
	}
	out := buf.String()
	buf.Reset()
	return out
}
