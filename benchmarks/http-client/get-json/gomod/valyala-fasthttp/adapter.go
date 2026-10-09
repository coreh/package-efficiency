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
	request.SetRequestURI(origin + input.(map[string]any)["path"].(string))
	if err := client.Do(request, response); err != nil {
		panic(err)
	}
	if response.StatusCode() != 200 {
		panic(fmt.Sprintf("status %d", response.StatusCode()))
	}
	var out any
	if err := json.Unmarshal(response.Body(), &out); err != nil {
		panic(err)
	}
	return out
}
