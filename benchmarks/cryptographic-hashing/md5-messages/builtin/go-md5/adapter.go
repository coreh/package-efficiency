package main

import "crypto/md5"

func operation(value any) any { return md5.Sum([]byte(value.(string))) }
