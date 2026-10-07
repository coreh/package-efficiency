package main

import sockaddr "github.com/hashicorp/go-sockaddr"

func operation(value any) any {
	addr, err := sockaddr.NewIPAddr(value.(string))
	if err != nil {
		panic(err)
	}
	return addr.NetIP().Mask(*addr.NetIPMask()).String()
}
