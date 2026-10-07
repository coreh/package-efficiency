package main

import (
	"encoding/json"
	"strconv"
	"strings"

	"github.com/andybalholm/cascadia"
	"golang.org/x/net/html"
)

type query struct {
	root     *html.Node
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

var parsed = map[string]*html.Node{}

// Not timed: the document is parsed once (shared between fixtures).
func prepare(value any) any {
	in := value.(map[string]any)
	src := in["html"].(string)
	root, ok := parsed[src]
	if !ok {
		var err error
		root, err = html.Parse(strings.NewReader(src))
		if err != nil {
			panic(err)
		}
		parsed[src] = root
	}
	return query{root, in["selector"].(string)}
}

func operation(value any) any {
	q := value.(query)
	sel, err := cascadia.Compile(q.selector)
	if err != nil {
		panic(err)
	}
	return nodes(sel.MatchAll(q.root))
}
