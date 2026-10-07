package main

func sideInt(keys, probes []any) [7]int64 {
	m := map[int64]int64{}
	for i, k := range keys {
		m[int64(k.(float64))] = int64(i)
	}
	size := int64(len(m))
	var hits, found int64
	for _, p := range probes {
		if v, ok := m[int64(p.(float64))]; ok {
			hits++
			found += v
		}
	}
	var ksum, vsum int64
	for k, v := range m {
		ksum += k
		vsum += v
	}
	for i := 0; i < len(keys); i += 2 {
		delete(m, int64(keys[i].(float64)))
	}
	count := int64(len(m))
	var left int64
	for _, p := range probes {
		if _, ok := m[int64(p.(float64))]; ok {
			left++
		}
	}
	return [7]int64{size, hits, found, ksum, vsum, count, left}
}

func sideString(keys, probes []any) [7]int64 {
	m := map[string]int64{}
	for i, k := range keys {
		m[k.(string)] = int64(i)
	}
	size := int64(len(m))
	var hits, found int64
	for _, p := range probes {
		if v, ok := m[p.(string)]; ok {
			hits++
			found += v
		}
	}
	var ksum, vsum int64
	for k, v := range m {
		ksum += int64(len(k))
		vsum += v
	}
	for i := 0; i < len(keys); i += 2 {
		delete(m, keys[i].(string))
	}
	count := int64(len(m))
	var left int64
	for _, p := range probes {
		if _, ok := m[p.(string)]; ok {
			left++
		}
	}
	return [7]int64{size, hits, found, ksum, vsum, count, left}
}

func operation(value any) any {
	v := value.(map[string]any)
	a := sideInt(v["ints"].([]any), v["intProbes"].([]any))
	b := sideString(v["strings"].([]any), v["stringProbes"].([]any))
	out := make([]int64, 0, 14)
	out = append(out, a[:]...)
	return append(out, b[:]...)
}
