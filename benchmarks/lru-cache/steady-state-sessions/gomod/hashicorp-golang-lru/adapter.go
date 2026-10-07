package main

import lru "github.com/hashicorp/golang-lru"

func operation(value any) any {
	in := value.(map[string]any)
	cache, err := lru.New(int(in["capacity"].(float64)))
	if err != nil {
		panic(err)
	}
	var hits, sum, removed int64
	for i, k := range in["keys"].([]any) {
		key := k.(string)
		if i%11 == 10 {
			if cache.Remove(key) {
				removed++
			}
		} else if v, ok := cache.Get(key); ok {
			hits++
			sum += v.(int64)
		} else {
			cache.Add(key, int64(i))
		}
	}
	return []int64{hits, sum, removed, int64(cache.Len())}
}
