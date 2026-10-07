package main

import (
	"encoding/json"

	"github.com/go-openapi/spec"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/validate"
)

var validator = func() *validate.SchemaValidator {
	var s spec.Schema
	if err := json.Unmarshal([]byte(`{
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
}`), &s); err != nil {
		panic(err)
	}
	return validate.NewSchemaValidator(&s, nil, "", strfmt.Default)
}()

func operation(value any) any {
	return validator.Validate(value).IsValid()
}
