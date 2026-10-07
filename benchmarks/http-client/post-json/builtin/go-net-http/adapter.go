package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

var client *http.Client
var origin string

func connect(host string, port int, lanes int) {
	origin = fmt.Sprintf("http://%s:%d", host, port)
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConnsPerHost = lanes
	transport.MaxConnsPerHost = lanes
	client = &http.Client{Transport: transport}
}

func operation(input any) any {
	fields := input.(map[string]any)
	response, err := client.Post(origin+fields["path"].(string), "application/json", strings.NewReader(fields["body"].(string)))
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
