package main

import "github.com/lithammer/dedent"

func operation(value any) any { return dedent.Dedent(value.(string)) }
