package main

import (
	"bytes"
	"html/template"
)

const tpl = `{{define "row"}}<tr class="row{{if .rush}} rush{{end}}"><td>{{.sku}}</td><td>{{.name}}</td><td>{{.qty}}</td><td>{{.price}}</td><td>{{if .rush}}Rush: {{.reason}}{{else}}Standard{{end}}</td></tr>{{end}}<article><h1>{{.title}}</h1><address>{{.customer.name}} &lt;{{.customer.email}}&gt;, {{.customer.address.city}}</address><table>
{{range .rows}}{{template "row" .}}
{{end}}</table><footer>{{.footer}} - {{.total}}</footer></article>`

var page = template.Must(template.New("page").Parse(tpl))

func operation(value any) any {
	var out bytes.Buffer
	if err := page.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
