require 'dry/schema'

SCHEMA = Dry::Schema.JSON do
  required(:id).filled(:integer, gteq?: 1)
  required(:name).filled(:string)
  required(:email).value(:string)
  required(:role).value(:string, included_in?: %w[admin editor viewer])
  required(:active).value(:bool)
  required(:tags).array(:string)
  required(:scores).value(:array).each { int? | float? }
  optional(:nickname).filled(:string)
  required(:address).hash do
    required(:city).filled(:string)
    required(:zip).value(:string)
    optional(:geo).hash do
      required(:lat) { (int? | float?) & gteq?(-90) & lteq?(90) }
      required(:lng) { (int? | float?) & gteq?(-180) & lteq?(180) }
    end
  end
end

def operation(value)
  errors = SCHEMA.call(value).errors.to_h
  return '' if errors.empty?
  path = +''
  node = errors
  while node.is_a?(Hash)
    key, node = node.first
    path << '/' << key.to_s
  end
  path
end
