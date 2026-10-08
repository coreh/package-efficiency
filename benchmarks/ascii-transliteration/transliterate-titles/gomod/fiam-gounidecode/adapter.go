package main

import "github.com/fiam/gounidecode/unidecode"

func operation(value any) any { return unidecode.Unidecode(value.(string)) }
