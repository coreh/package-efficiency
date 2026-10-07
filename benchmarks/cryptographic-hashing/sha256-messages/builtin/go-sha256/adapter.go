package main

import "crypto/sha256"

func operation(value any) any { return sha256.Sum256([]byte(value.(string))) }
