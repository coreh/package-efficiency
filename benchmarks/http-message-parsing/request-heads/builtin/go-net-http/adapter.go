package main

import (
	"bufio"
	"strings"
	"net/http"
)

type parsed struct {
	Method  string              `json:"method"`
	Path    string              `json:"path"`
	Minor   int                 `json:"minor"`
	Headers map[string][]string `json:"headers"`
}

// One buffered reader, reset for each request, as a server keeps one per connection.
var reader = bufio.NewReader(strings.NewReader(""))

func operation(value any) any {
	reader.Reset(strings.NewReader(value.(string)))
	req, err := http.ReadRequest(reader)
	if err != nil {
		panic(err)
	}
	headers := req.Header
	if req.Host != "" {
		headers["Host"] = []string{req.Host}
	}
	return parsed{req.Method, req.RequestURI, req.ProtoMinor, headers}
}
