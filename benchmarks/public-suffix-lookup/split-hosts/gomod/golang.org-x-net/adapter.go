package main

import "golang.org/x/net/publicsuffix"

func operation(value any) any {
	host := value.(string)
	domain, err := publicsuffix.EffectiveTLDPlusOne(host)
	if err != nil {
		return nil
	}
	suffix, _ := publicsuffix.PublicSuffix(host)
	sub := host[:len(host)-len(domain)]
	if len(sub) > 0 {
		sub = sub[:len(sub)-1]
	}
	return []string{sub, domain, suffix}
}
