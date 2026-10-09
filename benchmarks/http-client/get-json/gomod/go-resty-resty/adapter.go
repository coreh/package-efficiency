package main

import (
	"fmt"

	"github.com/go-resty/resty/v2"
)

var client *resty.Client

func connect(host string, port int, lanes int) {
	client = resty.New().SetBaseURL(fmt.Sprintf("http://%s:%d", host, port))
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
