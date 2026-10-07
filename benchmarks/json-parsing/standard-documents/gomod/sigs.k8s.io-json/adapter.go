package main
import "sigs.k8s.io/json"
func operation(value any) any { var out any; if err := json.UnmarshalCaseSensitivePreserveInts([]byte(value.(string)), &out); err != nil { panic(err) }; return out }
