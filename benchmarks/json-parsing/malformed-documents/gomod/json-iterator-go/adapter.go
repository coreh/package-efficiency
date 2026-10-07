package main
import jsoniter "github.com/json-iterator/go"
func operation(value any) any {
	var out any
	if err := jsoniter.ConfigDefault.Unmarshal([]byte(value.(string)), &out); err != nil {
		return nil
	}
	return out
}
