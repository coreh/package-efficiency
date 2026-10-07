package main

import sha256 "github.com/minio/sha256-simd"

func operation(value any) any { return sha256.Sum256([]byte(value.(string))) }
