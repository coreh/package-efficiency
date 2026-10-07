package main

import (
	"encoding/xml"
	"io"
	"strconv"
	"strings"
)

type summary struct {
	Products         int `json:"products"`
	InStock          int `json:"inStock"`
	Cents            int `json:"cents"`
	Tags             int `json:"tags"`
	DescriptionChars int `json:"descriptionChars"`
}

func operation(value any) any {
	decoder := xml.NewDecoder(strings.NewReader(value.(string)))
	var s summary
	// 1 inside price, 2 inside description.
	inside := 0
	var price []byte
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
			switch t.Name.Local {
			case "product":
				s.Products++
				for _, attr := range t.Attr {
					if attr.Name.Local == "stock" && attr.Value == "true" {
						s.InStock++
					}
				}
			case "tag":
				s.Tags++
			case "price":
				inside = 1
				price = price[:0]
			case "description":
				inside = 2
			}
		case xml.EndElement:
			if t.Name.Local == "price" {
				n, err := strconv.Atoi(string(price))
				if err != nil {
					panic(err)
				}
				s.Cents += n
			}
			if t.Name.Local == "price" || t.Name.Local == "description" {
				inside = 0
			}
		case xml.CharData:
			if inside == 1 {
				price = append(price, t...)
			} else if inside == 2 {
				// Code points other than space, tab, line feed and carriage return.
				for _, r := range string(t) {
					if r != ' ' && r != '\t' && r != '\n' && r != '\r' {
						s.DescriptionChars++
					}
				}
			}
		}
	}
}
