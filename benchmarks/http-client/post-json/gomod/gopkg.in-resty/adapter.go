package main

import (
	"fmt"
	"net/http"

	"gopkg.in/resty.v1"
)

var client *resty.Client

func connect(host string, port int, lanes int) {
	// resty v1 uses net/http's transport settings, which keep two idle
	// connections per host; eight lanes need eight.
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConnsPerHost = lanes
	client = resty.New().SetHostURL(fmt.Sprintf("http://%s:%d", host, port)).SetTransport(transport)
}

func operation(input any) any {
	fields := input.(map[string]any)
	var out any
	response, err := client.R().SetHeader("Content-Type", "application/json").SetBody(fields["body"].(string)).SetResult(&out).Post(fields["path"].(string))
	if err != nil {
		panic(err)
	}
	if response.StatusCode() != 201 {
		panic(fmt.Sprintf("status %d", response.StatusCode()))
	}
	return out
}
