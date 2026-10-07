package main

import (
	"encoding/xml"
	"io"
	"strings"
	"unicode/utf8"
)

type summary struct {
	Elements   int `json:"elements"`
	Attributes int `json:"attributes"`
	Text       int `json:"text"`
}

func operation(value any) any {
	decoder := xml.NewDecoder(strings.NewReader(value.(string)))
	var s summary
	for {
		token, err := decoder.Token()
		if err == io.EOF {
			return s
		}
		if err != nil {
			panic(err)
		}
		switch t := token.(type) {
		case xml.StartElement:
			s.Elements++
			for _, attr := range t.Attr {
				s.Attributes += utf8.RuneCountInString(attr.Value)
			}
		case xml.CharData:
			// Code points other than space, tab, line feed and carriage return.
			for _, r := range string(t) {
				if r != ' ' && r != '\t' && r != '\n' && r != '\r' {
					s.Text++
				}
			}
		}
	}
}
