require 'http'

def connect(host, port)
  HTTP.persistent("http://#{host}:#{port}")
end

def operation(client, value)
  response = client.get(value['path'])
  raise "status #{response.status}" unless response.status.code == 200
  response.parse
end
