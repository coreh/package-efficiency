package main

import (
	"bytes"

	"github.com/alecthomas/template"
)

const tpl = `{{define "row"}}<tr class="row{{if .rush}} rush{{end}}"><td>{{.sku | html}}</td><td>{{.name | html}}</td><td>{{.qty}}</td><td>{{.price}}</td><td>{{if .rush}}Rush: {{.reason | html}}{{else}}Standard{{end}}</td></tr>{{end}}<article><h1>{{.title | html}}</h1><address>{{.customer.name | html}} &lt;{{.customer.email | html}}&gt;, {{.customer.address.city | html}}</address><table>
{{range .rows}}{{template "row" .}}
{{end}}</table><footer>{{.footer | html}} - {{.total}}</footer></article>`

var page = template.Must(template.New("page").Parse(tpl))

func operation(value any) any {
	var out bytes.Buffer
	if err := page.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
