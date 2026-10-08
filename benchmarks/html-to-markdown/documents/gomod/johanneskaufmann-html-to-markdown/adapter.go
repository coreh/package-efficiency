package main

import htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"

func operation(value any) any {
	out, err := htmltomarkdown.ConvertString(value.(string))
	if err != nil {
		panic(err)
	}
	return out
}
