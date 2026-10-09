require 'http'

HEADERS = { 'Content-Type' => 'application/json' }.freeze

def connect(host, port)
  HTTP.persistent("http://#{host}:#{port}")
end

def operation(client, value)
  response = client.post(value['path'], body: value['body'], headers: HEADERS)
  raise "status #{response.status}" unless response.status.code == 201
  response.parse
end
