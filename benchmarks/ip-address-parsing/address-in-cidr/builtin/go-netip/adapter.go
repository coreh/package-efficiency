package main

import "net/netip"

func operation(value any) any {
	p := value.([]any)
	addr, err := netip.ParseAddr(p[0].(string))
	if err != nil {
		panic(err)
	}
	prefix, err := netip.ParsePrefix(p[1].(string))
	if err != nil {
		panic(err)
	}
	return prefix.Contains(addr)
}
