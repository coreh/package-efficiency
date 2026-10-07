package main

import "github.com/pborman/uuid"

func operation(value any) any { return uuid.New() }
