require 'net/http/persistent'
require 'json'

Client = Struct.new(:http, :base)

def connect(host, port)
  Client.new(Net::HTTP::Persistent.new, "http://#{host}:#{port}")
end

def operation(client, value)
  response = client.http.request(URI(client.base + value['path']))
  raise "status #{response.code}" unless response.is_a?(Net::HTTPOK)
  JSON.parse(response.body)
end
