package main

import (
	"bytes"

	"github.com/sirupsen/logrus"
)

var buf bytes.Buffer
var logger = func() *logrus.Logger {
	l := logrus.New()
	l.SetOutput(&buf)
	l.SetFormatter(&logrus.JSONFormatter{})
	return l
}()

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		msg := r["message"].(string)
		entry := logger.WithFields(logrus.Fields{
			"user_id":     int64(f["user_id"].(float64)),
			"route":       f["route"],
			"duration_ms": f["duration_ms"],
			"cached":      f["cached"],
			"region":      f["region"],
		})
		switch r["level"].(string) {
		case "info":
			entry.Info(msg)
		case "warn":
			entry.Warn(msg)
		default:
			entry.Error(msg)
		}
	}
	out := buf.String()
	buf.Reset()
	return out
}
