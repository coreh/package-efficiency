package main

import "time"

type prepared struct {
	loc      *time.Location
	instants []int64
}

// Not timed: runs once per fixture. The zone is loaded by name.
func prepare(value any) any {
	m := value.(map[string]any)
	loc, err := time.LoadLocation(m["zone"].(string))
	if err != nil {
		panic(err)
	}
	raw := m["instants"].([]any)
	instants := make([]int64, len(raw))
	for i, t := range raw {
		instants[i] = int64(t.(float64))
	}
	return prepared{loc, instants}
}

func operation(value any) any {
	p := value.(prepared)
	out := make([][2]any, len(p.instants))
	for i, t := range p.instants {
		local := time.Unix(t, 0).In(p.loc)
		_, offset := local.Zone()
		out[i] = [2]any{local.Format("2006-01-02T15:04:05"), offset}
	}
	return out
}
