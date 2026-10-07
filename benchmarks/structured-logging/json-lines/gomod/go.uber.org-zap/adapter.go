package main

import (
	"bytes"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var buf bytes.Buffer
var logger = zap.New(zapcore.NewCore(zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()), zapcore.AddSync(&buf), zapcore.InfoLevel))

func operation(value any) any {
	for _, item := range value.(map[string]any)["records"].([]any) {
		r := item.(map[string]any)
		f := r["fields"].(map[string]any)
		msg := r["message"].(string)
		fields := []zap.Field{
			zap.Int64("user_id", int64(f["user_id"].(float64))),
			zap.String("route", f["route"].(string)),
			zap.Float64("duration_ms", f["duration_ms"].(float64)),
			zap.Bool("cached", f["cached"].(bool)),
			zap.String("region", f["region"].(string)),
		}
		switch r["level"].(string) {
		case "info":
			logger.Info(msg, fields...)
		case "warn":
			logger.Warn(msg, fields...)
		default:
			logger.Error(msg, fields...)
		}
	}
	out := buf.String()
	buf.Reset()
	return out
}
