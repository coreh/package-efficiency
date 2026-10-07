package main
import "github.com/spaolacci/murmur3"
func operation(value any) any { return murmur3.Sum32([]byte(value.(string))) }
