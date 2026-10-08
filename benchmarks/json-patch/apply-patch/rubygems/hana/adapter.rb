require 'json'
require 'hana'

def operation(value)
  Hana::Patch.new(JSON.parse(value['patch'])).apply(JSON.parse(value['document'])).to_json
rescue Hana::Patch::Exception
  nil
end
