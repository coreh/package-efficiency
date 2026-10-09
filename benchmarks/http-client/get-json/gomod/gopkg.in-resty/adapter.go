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
	var out any
	response, err := client.R().SetResult(&out).Get(input.(map[string]any)["path"].(string))
	if err != nil {
		panic(err)
	}
	if response.StatusCode() != 200 {
		panic(fmt.Sprintf("status %d", response.StatusCode()))
	}
	return out
}
