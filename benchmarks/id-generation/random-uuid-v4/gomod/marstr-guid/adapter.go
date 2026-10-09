package main

import "github.com/marstr/guid"

func operation(value any) any { return guid.NewGUID().String() }
