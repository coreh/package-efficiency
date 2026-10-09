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
