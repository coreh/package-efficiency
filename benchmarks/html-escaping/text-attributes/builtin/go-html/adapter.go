package main
import "html"
func operation(value any) any { return html.EscapeString(value.(string)) }
