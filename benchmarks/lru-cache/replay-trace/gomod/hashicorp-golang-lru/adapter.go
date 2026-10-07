package main

import lru "github.com/hashicorp/golang-lru"

func operation(value any) any {
	in := value.(map[string]any)
	cache, err := lru.New(int(in["capacity"].(float64)))
	if err != nil {
		panic(err)
	}
	var hits int64
	for _, k := range in["keys"].([]any) {
		key := int64(k.(float64))
		if _, ok := cache.Get(key); ok {
			hits++
		} else {
			cache.Add(key, int64(1))
		}
	}
	return hits
}
