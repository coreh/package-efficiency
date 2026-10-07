package main

import units "github.com/docker/go-units"

func operation(value any) any { return units.BytesSize(value.(float64)) }
