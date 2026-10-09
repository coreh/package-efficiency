package main

import (
	"bytes"

	"github.com/rs/zerolog"
)

var buf bytes.Buffer
var logger = zerolog.New(&buf).Level(zerolog.InfoLevel).With().Timestamp().Logger()

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		msg := r["message"].(string)
		var e *zerolog.Event
		switch r["level"].(string) {
		case "info":
			e = logger.Info()
		case "warn":
			e = logger.Warn()
		default:
			e = logger.Error()
		}
		e.Int64("user_id", int64(f["user_id"].(float64))).
			Str("route", f["route"].(string)).
			Float64("duration_ms", f["duration_ms"].(float64)).
			Bool("cached", f["cached"].(bool)).
			Str("region", f["region"].(string)).
			Msg(msg)
	}
	out := buf.String()
	buf.Reset()
	return out
}
