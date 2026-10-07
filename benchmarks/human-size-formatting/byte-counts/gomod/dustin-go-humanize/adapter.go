package main

import humanize "github.com/dustin/go-humanize"

func operation(value any) any { return humanize.IBytes(uint64(value.(float64))) }
