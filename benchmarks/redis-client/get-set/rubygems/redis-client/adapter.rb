require 'redis-client'

def connect(host, port)
  RedisClient.config(host: host, port: port).new_client
end

def operation(client, input)
  client.call(input['command'], input['key'], *input['value'])
end
