require 'hiredis'

def connect(host, port)
  connection = Hiredis::Connection.new
  connection.connect(host, port)
  connection
end

def operation(connection, input)
  command = input['command'] == 'SET' ? ['SET', input['key'], input['value']] : ['GET', input['key']]
  connection.write(command)
  reply = connection.read
  raise reply if reply.is_a?(Exception)
  reply.is_a?(String) ? reply.dup.force_encoding(Encoding::UTF_8) : reply
end
