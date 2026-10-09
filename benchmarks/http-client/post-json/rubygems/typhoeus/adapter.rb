require 'typhoeus'
require 'json'

HEADERS = { 'Content-Type' => 'application/json' }.freeze
Client = Struct.new(:hydra, :base)

def connect(host, port)
  Client.new(Typhoeus::Hydra.new(max_concurrency: 1), "http://#{host}:#{port}")
end

def operation(client, value)
  request = Typhoeus::Request.new(client.base + value['path'], method: :post, body: value['body'], headers: HEADERS)
  client.hydra.queue(request)
  client.hydra.run
  response = request.response
  raise "status #{response.code} #{response.return_code}" unless response.code == 201
  JSON.parse(response.body)
end
