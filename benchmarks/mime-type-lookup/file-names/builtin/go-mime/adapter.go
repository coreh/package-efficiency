package main
import (
	"mime"
	"path/filepath"
)
func operation(value any) any { return mime.TypeByExtension(filepath.Ext(value.(string))) }
