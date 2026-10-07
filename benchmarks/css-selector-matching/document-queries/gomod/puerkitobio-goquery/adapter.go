package main

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"golang.org/x/net/html"
)

type query struct {
	doc      *goquery.Document
	selector string
}

// Marshalled once per fixture for the verifier; not part of the measured call.
type nodes []*html.Node

func (n nodes) MarshalJSON() ([]byte, error) {
	out := make([]int, 0, len(n))
	for _, e := range n {
		for _, a := range e.Attr {
			if a.Key == "data-n" {
				v, _ := strconv.Atoi(a.Val)
				out = append(out, v)
			}
		}
	}
	return json.Marshal(out)
}

var parsed = map[string]*goquery.Document{}

// Not timed: the document is parsed once (shared between fixtures).
func prepare(value any) any {
	in := value.(map[string]any)
	src := in["html"].(string)
	doc, ok := parsed[src]
	if !ok {
		var err error
		doc, err = goquery.NewDocumentFromReader(strings.NewReader(src))
		if err != nil {
			panic(err)
		}
		parsed[src] = doc
	}
	return query{doc, in["selector"].(string)}
}

func operation(value any) any {
	q := value.(query)
	return nodes(q.doc.Find(q.selector).Nodes)
}
