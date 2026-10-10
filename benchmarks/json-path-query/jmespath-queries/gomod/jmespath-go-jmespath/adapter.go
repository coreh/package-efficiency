package main

import "github.com/jmespath/go-jmespath"

type prepared struct {
	document any
	compiled []*jmespath.JMESPath
}

// Not timed: runs once per fixture.
func prepare(value any) any {
	input := value.(map[string]any)
	exprs := input["expressions"].([]any)
	p := &prepared{document: input["document"], compiled: make([]*jmespath.JMESPath, len(exprs))}
	for i, e := range exprs {
		c, err := jmespath.Compile(e.(string))
		if err != nil {
			panic(err)
		}
		p.compiled[i] = c
	}
	return p
}

func operation(value any) any {
	p := value.(*prepared)
	out := make([]any, len(p.compiled))
	for i, c := range p.compiled {
		v, err := c.Search(p.document)
		if err != nil {
			panic(err)
		}
		out[i] = v
	}
	return out
}
