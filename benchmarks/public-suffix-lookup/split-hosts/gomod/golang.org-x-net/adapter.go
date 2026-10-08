package main

import "golang.org/x/net/publicsuffix"

func operation(value any) any {
	domain, err := publicsuffix.EffectiveTLDPlusOne(value.(string))
	if err != nil {
		return nil
	}
	return domain
}
