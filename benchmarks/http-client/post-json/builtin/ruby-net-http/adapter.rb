require 'net/http'
require 'json'

HEADERS = { 'Content-Type' => 'application/json' }.freeze

def connect(host, port)
  Net::HTTP.start(host, port)
end

def operation(http, value)
  response = http.post(value['path'], value['body'], HEADERS)
  raise "status #{response.code}" unless response.is_a?(Net::HTTPCreated)
  JSON.parse(response.body)
end
