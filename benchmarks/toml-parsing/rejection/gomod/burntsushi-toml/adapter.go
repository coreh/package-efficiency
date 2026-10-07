package main
import toml "github.com/BurntSushi/toml"

func operation(value any) any {
	var out map[string]any
	_, err := toml.Decode(value.(string), &out)
	return err == nil
}
