package main

import "github.com/ua-parser/uap-go/uaparser"

var parser = func() *uaparser.Parser {
	p, err := uaparser.New(uaparser.WithCacheSize(1))
	if err != nil {
		panic(err)
	}
	return p
}()

func operation(value any) any {
	ua := value.(string)
	b := parser.ParseUserAgent(ua)
	o := parser.ParseOs(ua)
	return map[string]string{"browser": b.Family, "version": b.Major, "os": o.Family}
}
