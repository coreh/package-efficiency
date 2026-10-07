package main

import (
	"bytes"

	"github.com/alecthomas/template"
)

const tpl = `<section title="{{.title | html}}"><h1>{{.title | html}}</h1><p>By {{.author | html}}</p><ul>
{{range .items}}<li id="item-{{.id}}" class="item{{if .featured}} featured{{end}}" title="{{.name | html}}"><b>{{.name | html}}</b> <span>{{.price}}</span>{{if .note}}<em>{{.note | html}}</em>{{end}}{{range .tags}}<i>{{. | html}}</i>{{end}}</li>
{{end}}</ul><p>{{.count}} items</p></section>`

func operation(value any) any {
	t := template.Must(template.New("t").Parse(tpl))
	var out bytes.Buffer
	if err := t.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
