require 'redis'

def connect(host, port)
  Redis.new(host: host, port: port)
end

def operation(client, input)
  input['command'] == 'SET' ? client.set(input['key'], input['value']) : client.get(input['key'])
end
