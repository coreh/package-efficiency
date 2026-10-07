package main

import sockaddr "github.com/hashicorp/go-sockaddr"

func operation(value any) any {
	p := value.([]any)
	addr, err := sockaddr.NewIPAddr(p[0].(string))
	if err != nil {
		panic(err)
	}
	network, err := sockaddr.NewIPAddr(p[1].(string))
	if err != nil {
		panic(err)
	}
	return network.Contains(addr)
}
