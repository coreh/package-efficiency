package main

import "github.com/klauspost/crc32"

func operation(value any) any { return crc32.ChecksumIEEE([]byte(value.(string))) }
