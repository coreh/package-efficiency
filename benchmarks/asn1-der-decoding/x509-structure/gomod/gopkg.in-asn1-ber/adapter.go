package main

import (
	"encoding/hex"

	ber "gopkg.in/asn1-ber.v1"
)

func walk(p *ber.Packet, out []int) []int {
	out = append(out, int(p.ClassType>>6)*100+int(p.Tag))
	for _, c := range p.Children {
		out = walk(c, out)
	}
	return out
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	raw, err := hex.DecodeString(value.(string))
	if err != nil {
		panic(err)
	}
	return raw
}

func operation(value any) any {
	p, err := ber.DecodePacketErr(value.([]byte))
	if err != nil {
		panic(err)
	}
	return walk(p, nil)
}
