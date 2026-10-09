require 'httpclient'
require 'json'

HEADERS = { 'Content-Type' => 'application/json' }.freeze
Client = Struct.new(:http, :base)

def connect(host, port)
  Client.new(HTTPClient.new, "http://#{host}:#{port}")
end

def operation(client, value)
  response = client.http.post(client.base + value['path'], body: value['body'], header: HEADERS)
  raise "status #{response.status}" unless response.status == 201
  JSON.parse(response.body)
end
