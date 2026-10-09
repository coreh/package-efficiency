require 'childprocess'

def operation(value)
  process = ChildProcess.build(value['command'], *value['args'])
  reader, writer = IO.pipe
  process.io.stdout = writer
  process.start
  writer.close
  stdout = reader.read
  reader.close
  process.wait
  { 'stdout' => stdout.force_encoding('UTF-8'), 'status' => process.exit_code }
end
