package main
import "github.com/bytedance/sonic"
func operation(value any) any { var out any; if err := sonic.Unmarshal([]byte(value.(string)), &out); err != nil { panic(err) }; return out }
