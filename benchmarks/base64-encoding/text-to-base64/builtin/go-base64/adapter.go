package main
import "encoding/base64"
func operation(value any) any { return base64.StdEncoding.EncodeToString([]byte(value.(string))) }
