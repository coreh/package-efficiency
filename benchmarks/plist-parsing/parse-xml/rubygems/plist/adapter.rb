require 'plist'
require 'base64'

def operation(xml)
  Plist.parse_xml(xml)
end

# Not timed: runs once per fixture. Dates and data get the task's common shape.
def describe(value)
  case value
  when Hash then value.to_h { |k, v| [k, describe(v)] }
  when Array then value.map { |v| describe(v) }
  when StringIO then { '$data' => Base64.strict_encode64(value.string) }
  when DateTime, Time then { '$date' => value.to_time.utc.strftime('%Y-%m-%dT%H:%M:%SZ') }
  else value
  end
end
