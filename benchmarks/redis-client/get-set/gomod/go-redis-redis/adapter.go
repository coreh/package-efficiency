package main

import (
	"fmt"

	"github.com/go-redis/redis"
)

var client *redis.Client

func connect(host string, port int, lanes int) {
	client = redis.NewClient(&redis.Options{Addr: fmt.Sprintf("%s:%d", host, port)})
}

func operation(input any) any {
	m := input.(map[string]any)
	var reply string
	var err error
	if m["command"].(string) == "SET" {
		reply, err = client.Set(m["key"].(string), m["value"].(string), 0).Result()
	} else {
		reply, err = client.Get(m["key"].(string)).Result()
	}
	if err != nil {
		panic(err)
	}
	return reply
}
