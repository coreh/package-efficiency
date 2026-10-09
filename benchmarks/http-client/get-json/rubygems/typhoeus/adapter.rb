require 'typhoeus'
require 'json'

Client = Struct.new(:hydra, :base)

def connect(host, port)
  Client.new(Typhoeus::Hydra.new(max_concurrency: 1), "http://#{host}:#{port}")
end

def operation(client, value)
  request = Typhoeus::Request.new(client.base + value['path'])
  client.hydra.queue(request)
  client.hydra.run
  response = request.response
  raise "status #{response.code} #{response.return_code}" unless response.code == 200
  JSON.parse(response.body)
end
