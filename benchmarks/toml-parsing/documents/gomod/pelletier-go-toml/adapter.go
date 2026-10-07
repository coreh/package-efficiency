package main
import toml "github.com/pelletier/go-toml/v2"

func operation(value any) any {
	var out map[string]any
	if err := toml.Unmarshal([]byte(value.(string)), &out); err != nil {
		panic(err)
	}
	return out
}
