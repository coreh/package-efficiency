package main
import toml "github.com/BurntSushi/toml"

func operation(value any) any {
	var out map[string]any
	if _, err := toml.Decode(value.(string), &out); err != nil {
		panic(err)
	}
	return out
}
