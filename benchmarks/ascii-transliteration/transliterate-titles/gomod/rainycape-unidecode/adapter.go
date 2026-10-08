package main

import "github.com/rainycape/unidecode"

func operation(value any) any { return unidecode.Unidecode(value.(string)) }
