package main

import "crypto/sha3"

func operation(value any) any { return sha3.Sum256([]byte(value.(string))) }
