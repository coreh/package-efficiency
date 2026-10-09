package main

import (
	"encoding/json"
	"fmt"
	"io"

	"github.com/hashicorp/go-retryablehttp"
)

var client *retryablehttp.Client
var origin string

func connect(host string, port int, lanes int) {
	origin = fmt.Sprintf("http://%s:%d", host, port)
	client = retryablehttp.NewClient()
	// No retries (the task has none) and no log line per request.
	client.RetryMax = 0
	client.Logger = nil
}

func operation(input any) any {
	fields := input.(map[string]any)
	response, err := client.Post(origin+fields["path"].(string), "application/json", []byte(fields["body"].(string)))
	if err != nil {
		panic(err)
	}
	defer response.Body.Close()
	if response.StatusCode != 201 {
		panic(fmt.Sprintf("status %d", response.StatusCode))
	}
	body, err := io.ReadAll(response.Body)
	if err != nil {
		panic(err)
	}
	var out any
	if err := json.Unmarshal(body, &out); err != nil {
		panic(err)
	}
	return out
}
