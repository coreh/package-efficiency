package main

import (
	"fmt"
	"net/http"

	"github.com/franela/goreq"
)

var origin string

func connect(host string, port int, lanes int) {
	origin = fmt.Sprintf("http://%s:%d", host, port)
	// goreq's shared transport keeps two idle connections per host, as
	// net/http's does; eight lanes need eight.
	goreq.DefaultTransport.(*http.Transport).MaxIdleConnsPerHost = lanes
}

func operation(input any) any {
	fields := input.(map[string]any)
	response, err := goreq.Request{Method: "POST", Uri: origin + fields["path"].(string), ContentType: "application/json", Body: fields["body"].(string)}.Do()
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 201 {
		panic(fmt.Sprintf("status %d", response.StatusCode))
	}
	var out any
	if err := response.Body.FromJsonTo(&out); err != nil {
		panic(err)
	}
	return out
}
