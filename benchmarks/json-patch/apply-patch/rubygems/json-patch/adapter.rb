require 'json'
require 'json/patch'

def operation(value)
  JSON::Patch.new(JSON.parse(value['document']), JSON.parse(value['patch'])).call.to_json
rescue StandardError
  nil
end
