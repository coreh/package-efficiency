package main

import "net/netip"

func operation(value any) any {
	prefix, err := netip.ParsePrefix(value.(string))
	if err != nil {
		panic(err)
	}
	return prefix.Masked().Addr().String()
}
