require 'tty-command'

COMMAND = TTY::Command.new(printer: :null, uuid: false)

def operation(value)
  result = COMMAND.run(value['command'], *value['args'])
  { 'stdout' => result.out.force_encoding('UTF-8'), 'status' => result.exit_status }
end
