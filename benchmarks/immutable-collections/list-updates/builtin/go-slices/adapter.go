package main

func operation(value any) any {
	in := value.(map[string]any)
	items := in["items"].([]any)
	list := make([]any, len(items))
	copy(list, items)
	gets := []any{}
	for _, o := range in["ops"].([]any) {
		op := o.([]any)
		kind, v := op[0].(string), op[2]
		i := int(op[1].(float64))
		switch kind {
		case "set":
			n := make([]any, len(list))
			copy(n, list)
			n[i] = v
			list = n
		case "insert":
			n := make([]any, 0, len(list)+1)
			n = append(n, list[:i]...)
			n = append(n, v)
			n = append(n, list[i:]...)
			list = n
		case "remove":
			n := make([]any, 0, len(list))
			n = append(n, list[:i]...)
			n = append(n, list[i+1:]...)
			list = n
		default:
			gets = append(gets, list[i])
		}
	}
	return []any{list, gets}
}
