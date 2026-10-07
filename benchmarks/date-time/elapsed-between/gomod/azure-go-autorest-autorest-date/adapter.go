package main

import "github.com/Azure/go-autorest/autorest/date"

func operation(value any) any {
	m := value.(map[string]any)
	var a, b date.Time
	if err := a.UnmarshalText([]byte(m["from"].(string))); err != nil {
		panic(err)
	}
	if err := b.UnmarshalText([]byte(m["to"].(string))); err != nil {
		panic(err)
	}
	d := b.Sub(a.Time)
	return []int64{int64(d.Hours()), int64(d.Minutes()), int64(d.Seconds())}
}
