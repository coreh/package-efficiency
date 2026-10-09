package main

import "github.com/jinzhu/now"

func operation(value any) any {
	m := value.(map[string]any)
	a, err := now.Parse(m["from"].(string))
	if err != nil {
		panic(err)
	}
	b, err := now.Parse(m["to"].(string))
	if err != nil {
		panic(err)
	}
	d := b.Sub(a)
	return []int64{int64(d.Hours()), int64(d.Minutes()), int64(d.Seconds())}
}
