package main

import "github.com/MakeNowJust/heredoc"

func operation(value any) any { return heredoc.Doc(value.(string)) }
