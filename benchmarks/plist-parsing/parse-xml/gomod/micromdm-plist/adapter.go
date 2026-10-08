package main

import (
	"encoding/base64"
	"encoding/json"
	"time"

	plist "github.com/micromdm/plist"
)

// Not timed: runs once per fixture.
func prepare(value any) any { return []byte(value.(string)) }

func operation(value any) any {
	var out any
	if err := plist.Unmarshal(value.([]byte), &out); err != nil {
		panic(err)
	}
	return &result{out}
}

// result holds what the library returned. It is written as JSON once per
// fixture, before any measured work: dates become { "$date": text } and data
// { "$data": base64 }.
type result struct{ value any }

func common(v any) any {
	switch x := v.(type) {
	case map[string]any:
		out := make(map[string]any, len(x))
		for k, e := range x {
			out[k] = common(e)
		}
		return out
	case []any:
		out := make([]any, len(x))
		for i, e := range x {
			out[i] = common(e)
		}
		return out
	case []byte:
		return map[string]any{"$data": base64.StdEncoding.EncodeToString(x)}
	case time.Time:
		return map[string]any{"$date": x.UTC().Format("2006-01-02T15:04:05Z")}
	default:
		return v
	}
}

func (r *result) MarshalJSON() ([]byte, error) { return json.Marshal(common(r.value)) }
