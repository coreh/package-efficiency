package main

import "github.com/russross/blackfriday/v2"

func operation(value any) any {
	return string(blackfriday.Run([]byte(value.(string))))
}
