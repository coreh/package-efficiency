package main

import (
	"encoding/json"
	"fmt"

	"github.com/valyala/fasthttp"
)

var client *fasthttp.Client
var origin string

func connect(host string, port int, lanes int) {
	origin = fmt.Sprintf("http://%s:%d", host, port)
	client = &fasthttp.Client{}
}

func operation(input any) any {
	request := fasthttp.AcquireRequest()
	response := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseRequest(request)
	defer fasthttp.ReleaseResponse(response)
	fields := input.(map[string]any)
	request.SetRequestURI(origin + fields["path"].(string))
	request.Header.SetMethod(fasthttp.MethodPost)
	request.Header.SetContentType("application/json")
	request.SetBodyString(fields["body"].(string))
	if err := client.Do(request, response); err != nil {
		panic(err)
	}
	if response.StatusCode() != 201 {
		panic(fmt.Sprintf("status %d", response.StatusCode()))
	}
	var out any
	if err := json.Unmarshal(response.Body(), &out); err != nil {
		panic(err)
	}
	return out
}
