package main

import (
	"strings"

	"github.com/xeipuuv/gojsonschema"
)

var schema = func() *gojsonschema.Schema {
	s, err := gojsonschema.NewSchema(gojsonschema.NewStringLoader(`{
  "type": "object",
  "required": ["id", "name", "email", "role", "active", "tags", "scores", "address"],
  "properties": {
    "id": {"type": "integer", "minimum": 1},
    "name": {"type": "string", "minLength": 1},
    "email": {"type": "string"},
    "role": {"enum": ["admin", "editor", "viewer"]},
    "active": {"type": "boolean"},
    "tags": {"type": "array", "items": {"type": "string"}},
    "scores": {"type": "array", "items": {"type": "number"}},
    "nickname": {"type": "string"},
    "address": {
      "type": "object",
      "required": ["city", "zip"],
      "properties": {
        "city": {"type": "string", "minLength": 1},
        "zip": {"type": "string"},
        "geo": {
          "type": "object",
          "required": ["lat", "lng"],
          "properties": {
            "lat": {"type": "number", "minimum": -90, "maximum": 90},
            "lng": {"type": "number", "minimum": -180, "maximum": 180}
          }
        }
      }
    }
  }
}`))
	if err != nil {
		panic(err)
	}
	return s
}()

func operation(value any) any {
	result, err := schema.Validate(gojsonschema.NewGoLoader(value))
	if err != nil {
		panic(err)
	}
	if result.Valid() {
		return ""
	}
	e := result.Errors()[0]
	path := ""
	if e.Field() != "(root)" {
		path = "/" + strings.ReplaceAll(e.Field(), ".", "/")
	}
	if e.Type() == "required" {
		path += "/" + e.Details()["property"].(string)
	}
	return path
}
