package main

import (
	"bytes"

	"github.com/eknkc/amber"
)

// The li tags are text lines: amber writes an element's class before its id,
// and the page puts the id first.
const tpl = `section[title=title]
	h1 #{title}
	p By #{author}
	ul
		each $item in items
			if $item.featured
				| <li id="item-#{$item.id}" class="item featured" title="#{$item.name}">
			else
				| <li id="item-#{$item.id}" class="item" title="#{$item.name}">
			b #{$item.name}
			span #{$item.price}
			if $item.note != ""
				em #{$item.note}
			each $tag in $item.tags
				i #{$tag}
			| </li>
	p #{count} items
`

func operation(value any) any {
	c := amber.New()
	if err := c.Parse(tpl); err != nil {
		panic(err)
	}
	t, err := c.Compile()
	if err != nil {
		panic(err)
	}
	var out bytes.Buffer
	if err := t.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
