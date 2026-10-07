require 'json-schema'

SCHEMA = {
  "type" => "object",
  "required" => %w[id name email role active tags scores address],
  "properties" => {
    "id" => { "type" => "integer", "minimum" => 1 },
    "name" => { "type" => "string", "minLength" => 1 },
    "email" => { "type" => "string" },
    "role" => { "enum" => %w[admin editor viewer] },
    "active" => { "type" => "boolean" },
    "tags" => { "type" => "array", "items" => { "type" => "string" } },
    "scores" => { "type" => "array", "items" => { "type" => "number" } },
    "nickname" => { "type" => "string" },
    "address" => {
      "type" => "object",
      "required" => %w[city zip],
      "properties" => {
        "city" => { "type" => "string", "minLength" => 1 },
        "zip" => { "type" => "string" },
        "geo" => {
          "type" => "object",
          "required" => %w[lat lng],
          "properties" => {
            "lat" => { "type" => "number", "minimum" => -90, "maximum" => 90 },
            "lng" => { "type" => "number", "minimum" => -180, "maximum" => 180 }
          }
        }
      }
    }
  }
}.freeze

def operation(value)
  JSON::Validator.validate(SCHEMA, value)
end
