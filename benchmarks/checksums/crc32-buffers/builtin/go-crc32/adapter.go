package main
import "hash/crc32"
func operation(value any) any { return crc32.ChecksumIEEE([]byte(value.(string))) }
