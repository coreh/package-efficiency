package main

import ini "gopkg.in/ini.v1"

func operation(value any) any {
	f, err := ini.Load([]byte(value.(string)))
	if err != nil {
		panic(err)
	}
	out := map[string]map[string]string{}
	for _, s := range f.Sections() {
		if s.Name() == ini.DefaultSection {
			continue
		}
		out[s.Name()] = s.KeysHash()
	}
	return out
}
