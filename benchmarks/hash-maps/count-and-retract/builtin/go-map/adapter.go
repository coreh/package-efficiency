package main

func sideInt(events, drops []any) [6]int64 {
	m := map[int64]int64{}
	for _, k := range events {
		m[int64(k.(float64))]++
	}
	var mx, sq, ws int64
	for k, c := range m {
		if c > mx {
			mx = c
		}
		sq += c * c
		ws += k * c
	}
	distinct := int64(len(m))
	for _, d := range drops {
		k := int64(d.(float64))
		c, ok := m[k]
		if !ok {
			continue
		}
		if c == 1 {
			delete(m, k)
		} else {
			m[k] = c - 1
		}
	}
	var total int64
	for _, c := range m {
		total += c
	}
	return [6]int64{distinct, mx, sq, ws, int64(len(m)), total}
}

func sideString(events, drops []any) [6]int64 {
	m := map[string]int64{}
	for _, k := range events {
		m[k.(string)]++
	}
	var mx, sq, ws int64
	for k, c := range m {
		if c > mx {
			mx = c
		}
		sq += c * c
		ws += int64(len(k)) * c
	}
	distinct := int64(len(m))
	for _, d := range drops {
		k := d.(string)
		c, ok := m[k]
		if !ok {
			continue
		}
		if c == 1 {
			delete(m, k)
		} else {
			m[k] = c - 1
		}
	}
	var total int64
	for _, c := range m {
		total += c
	}
	return [6]int64{distinct, mx, sq, ws, int64(len(m)), total}
}

func operation(value any) any {
	v := value.(map[string]any)
	a := sideInt(v["ints"].([]any), v["intRetracts"].([]any))
	b := sideString(v["strings"].([]any), v["stringRetracts"].([]any))
	out := make([]int64, 0, 12)
	out = append(out, a[:]...)
	return append(out, b[:]...)
}
