package main

import "time"

func operation(value any) any {
	m := value.(map[string]any)
	a, err := time.Parse(time.RFC3339, m["from"].(string))
	if err != nil {
		panic(err)
	}
	b, err := time.Parse(time.RFC3339, m["to"].(string))
	if err != nil {
		panic(err)
	}
	d := b.Sub(a)
	return []int64{int64(d.Hours()), int64(d.Minutes()), int64(d.Seconds())}
}
