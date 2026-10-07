package main

import (
	"bytes"
	"encoding/xml"
)

func add(enc *xml.Encoder, node map[string]any) {
	start := xml.StartElement{Name: xml.Name{Local: node["name"].(string)}}
	for name, value := range node["attrs"].(map[string]any) {
		start.Attr = append(start.Attr, xml.Attr{Name: xml.Name{Local: name}, Value: value.(string)})
	}
	if err := enc.EncodeToken(start); err != nil {
		panic(err)
	}
	if children, ok := node["children"].([]any); ok {
		for _, child := range children {
			add(enc, child.(map[string]any))
		}
	} else if err := enc.EncodeToken(xml.CharData(node["text"].(string))); err != nil {
		panic(err)
	}
	if err := enc.EncodeToken(start.End()); err != nil {
		panic(err)
	}
}

func operation(value any) any {
	var buf bytes.Buffer
	enc := xml.NewEncoder(&buf)
	add(enc, value.(map[string]any))
	if err := enc.Flush(); err != nil {
		panic(err)
	}
	return buf.String()
}
