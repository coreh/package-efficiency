package main

import "github.com/rivo/uniseg"

func operation(value any) any { return uniseg.StringWidth(value.(string)) }
