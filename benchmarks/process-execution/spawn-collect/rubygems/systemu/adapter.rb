require 'systemu'

def operation(value)
  status, stdout, _stderr = Systemu.systemu([value['command'], *value['args']])
  { 'stdout' => stdout.force_encoding('UTF-8'), 'status' => status.exitstatus }
end
