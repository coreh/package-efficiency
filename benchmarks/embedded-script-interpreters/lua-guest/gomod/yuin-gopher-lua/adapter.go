package main

import lua "github.com/yuin/gopher-lua"

func operation(value any) any {
	L := lua.NewState()
	defer L.Close()
	if err := L.DoString(value.(string)); err != nil {
		panic(err)
	}
	switch v := L.Get(-1).(type) {
	case lua.LNumber:
		return float64(v)
	case lua.LString:
		return string(v)
	}
	panic("unexpected result type")
}
