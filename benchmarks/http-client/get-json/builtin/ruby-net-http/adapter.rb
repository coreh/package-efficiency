require 'net/http'
require 'json'

def connect(host, port)
  Net::HTTP.start(host, port)
end

def operation(http, value)
  response = http.get(value['path'])
  raise "status #{response.code}" unless response.is_a?(Net::HTTPOK)
  JSON.parse(response.body)
end
