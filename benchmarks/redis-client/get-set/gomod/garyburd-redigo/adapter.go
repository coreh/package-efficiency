package main

import (
	"fmt"

	"github.com/garyburd/redigo/redis"
)

var pool *redis.Pool

func connect(host string, port int, lanes int) {
	address := fmt.Sprintf("%s:%d", host, port)
	pool = &redis.Pool{
		// A redigo connection serves one goroutine at a time; the pool hands
		// one to each lane. MaxIdle is 0 by default, which closes a connection
		// after every use, so it is set to the number of lanes.
		MaxIdle: lanes,
		Dial:    func() (redis.Conn, error) { return redis.Dial("tcp", address) },
	}
}

func operation(input any) any {
	m := input.(map[string]any)
	conn := pool.Get()
	defer conn.Close()
	var reply string
	var err error
	if m["command"].(string) == "SET" {
		reply, err = redis.String(conn.Do("SET", m["key"].(string), m["value"].(string)))
	} else {
		reply, err = redis.String(conn.Do("GET", m["key"].(string)))
	}
	if err != nil {
		panic(err)
	}
	return reply
}
