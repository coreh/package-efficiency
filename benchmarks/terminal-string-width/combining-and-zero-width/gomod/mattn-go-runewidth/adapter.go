package main

import "github.com/mattn/go-runewidth"

func operation(value any) any { return runewidth.StringWidth(value.(string)) }
