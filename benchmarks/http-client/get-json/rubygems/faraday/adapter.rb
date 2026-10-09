require 'faraday'
require 'faraday/net_http_persistent'

def connect(host, port)
  Faraday.new("http://#{host}:#{port}") do |f|
    f.response :raise_error
    f.response :json
    f.adapter :net_http_persistent
  end
end

def operation(connection, value)
  response = connection.get(value['path'])
  raise "status #{response.status}" unless response.status == 200
  response.body
end
