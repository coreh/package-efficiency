package main
import "encoding/json"
func operation(value any) any { var out any; if err:=json.Unmarshal([]byte(value.(string)),&out);err!=nil {panic(err)}; return out }
