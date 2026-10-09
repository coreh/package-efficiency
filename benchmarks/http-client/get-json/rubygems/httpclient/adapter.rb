require 'httpclient'
require 'json'

Client = Struct.new(:http, :base)

def connect(host, port)
  Client.new(HTTPClient.new, "http://#{host}:#{port}")
end

def operation(client, value)
  response = client.http.get(client.base + value['path'])
  raise "status #{response.status}" unless response.status == 200
  JSON.parse(response.body)
end
