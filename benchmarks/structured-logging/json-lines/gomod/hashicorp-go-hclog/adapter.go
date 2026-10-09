package main

import (
	"bytes"

	"github.com/hashicorp/go-hclog"
)

var buf bytes.Buffer
var logger = hclog.New(&hclog.LoggerOptions{
	Output:     &buf,
	JSONFormat: true,
	Level:      hclog.Info,
})

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		msg := r["message"].(string)
		userID := int64(f["user_id"].(float64))
		switch r["level"].(string) {
		case "info":
			logger.Info(msg, "user_id", userID, "route", f["route"], "duration_ms", f["duration_ms"], "cached", f["cached"], "region", f["region"])
		case "warn":
			logger.Warn(msg, "user_id", userID, "route", f["route"], "duration_ms", f["duration_ms"], "cached", f["cached"], "region", f["region"])
		default:
			logger.Error(msg, "user_id", userID, "route", f["route"], "duration_ms", f["duration_ms"], "cached", f["cached"], "region", f["region"])
		}
	}
	out := buf.String()
	buf.Reset()
	return out
}
