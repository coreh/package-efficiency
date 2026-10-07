package main

import "regexp"

var ansi = regexp.MustCompile("\x1b\\[[0-?]*[ -/]*[@-~]|\x1b\\][^\x07\x1b]*(?:\x07|\x1b\\\\)")

func operation(value any) any { return ansi.ReplaceAllString(value.(string), "") }
