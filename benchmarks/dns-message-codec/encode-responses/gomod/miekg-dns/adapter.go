package main

import (
	"encoding/json"
	"net"

	"github.com/miekg/dns"
)

// wire marshals as an array of byte values; used once per fixture, outside timing.
type wire []byte

func (w wire) MarshalJSON() ([]byte, error) {
	out := make([]int, len(w))
	for i, b := range w {
		out[i] = int(b)
	}
	return json.Marshal(out)
}

func operation(value any) any {
	in := value.(map[string]any)
	m := new(dns.Msg)
	m.Id = uint16(in["id"].(float64))
	m.Response = true
	m.Authoritative = in["aa"].(bool)
	m.RecursionDesired = in["rd"].(bool)
	m.RecursionAvailable = in["ra"].(bool)
	m.Compress = true
	q := in["question"].(map[string]any)
	m.Question = []dns.Question{{Name: q["name"].(string), Qtype: dns.StringToType[q["type"].(string)], Qclass: dns.ClassINET}}
	for _, av := range in["answers"].([]any) {
		a := av.(map[string]any)
		hdr := dns.RR_Header{Name: a["name"].(string), Class: dns.ClassINET, Ttl: uint32(a["ttl"].(float64))}
		switch a["type"].(string) {
		case "A":
			hdr.Rrtype = dns.TypeA
			m.Answer = append(m.Answer, &dns.A{Hdr: hdr, A: net.ParseIP(a["data"].(string))})
		case "AAAA":
			hdr.Rrtype = dns.TypeAAAA
			m.Answer = append(m.Answer, &dns.AAAA{Hdr: hdr, AAAA: net.ParseIP(a["data"].(string))})
		case "CNAME":
			hdr.Rrtype = dns.TypeCNAME
			m.Answer = append(m.Answer, &dns.CNAME{Hdr: hdr, Target: a["data"].(string)})
		case "MX":
			hdr.Rrtype = dns.TypeMX
			d := a["data"].(map[string]any)
			m.Answer = append(m.Answer, &dns.MX{Hdr: hdr, Preference: uint16(d["preference"].(float64)), Mx: d["exchange"].(string)})
		default:
			hdr.Rrtype = dns.TypeTXT
			var txt []string
			for _, s := range a["data"].([]any) {
				txt = append(txt, s.(string))
			}
			m.Answer = append(m.Answer, &dns.TXT{Hdr: hdr, Txt: txt})
		}
	}
	out, err := m.Pack()
	if err != nil {
		panic(err)
	}
	return wire(out)
}
