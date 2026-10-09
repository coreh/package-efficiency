package main

import (
	"bytes"
	"html/template"

	"github.com/eknkc/amber"
)

// The tr tags are text lines: a conditional class on an element would leave a
// trailing space in the attribute when the condition is false.
const tpl = `mixin row($r)
	if $r.rush
		| <tr class="row rush">
	else
		| <tr class="row">
	td #{$r.sku}
	td #{$r.name}
	td #{$r.qty}
	td #{$r.price}
	td
		if $r.rush
			| Rush: #{$r.reason}
		else
			| Standard
	| </tr>
article
	h1 #{title}
	address #{customer.name} &lt;#{customer.email}&gt;, #{customer.address.city}
	table
		each $r in rows
			+row($r)
	footer #{footer} - #{total}
`

var page = func() *template.Template {
	t, err := amber.Compile(tpl, amber.Options{PrettyPrint: false})
	if err != nil {
		panic(err)
	}
	return t
}()

func operation(value any) any {
	var out bytes.Buffer
	if err := page.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
