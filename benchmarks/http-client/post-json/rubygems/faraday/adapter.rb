require 'faraday'
require 'faraday/net_http_persistent'

HEADERS = { 'Content-Type' => 'application/json' }.freeze

def connect(host, port)
  Faraday.new("http://#{host}:#{port}") do |f|
    f.response :raise_error
    f.response :json
    f.adapter :net_http_persistent
  end
end

def operation(connection, value)
  response = connection.post(value['path'], value['body'], HEADERS)
  raise "status #{response.status}" unless response.status == 201
  response.body
end
