require 'net/http/persistent'
require 'json'

Client = Struct.new(:http, :base)

def connect(host, port)
  Client.new(Net::HTTP::Persistent.new, "http://#{host}:#{port}")
end

def operation(client, value)
  uri = URI(client.base + value['path'])
  request = Net::HTTP::Post.new(uri, 'Content-Type' => 'application/json')
  request.body = value['body']
  response = client.http.request(uri, request)
  raise "status #{response.code}" unless response.is_a?(Net::HTTPCreated)
  JSON.parse(response.body)
end
