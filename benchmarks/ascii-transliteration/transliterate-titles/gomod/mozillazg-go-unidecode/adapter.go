package main

import "github.com/mozillazg/go-unidecode"

func operation(value any) any { return unidecode.Unidecode(value.(string)) }
