package main

import (
	"bytes"
	"html/template"
)

const tpl = `<section title="{{.title}}"><h1>{{.title}}</h1><p>By {{.author}}</p><ul>
{{range .items}}<li id="item-{{.id}}" class="item{{if .featured}} featured{{end}}" title="{{.name}}"><b>{{.name}}</b> <span>{{.price}}</span>{{if .note}}<em>{{.note}}</em>{{end}}{{range .tags}}<i>{{.}}</i>{{end}}</li>
{{end}}</ul><p>{{.count}} items</p></section>`

func operation(value any) any {
	t := template.Must(template.New("t").Parse(tpl))
	var out bytes.Buffer
	if err := t.Execute(&out, value); err != nil {
		panic(err)
	}
	return out.String()
}
