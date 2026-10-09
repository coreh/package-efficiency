require 'shellany/sheller'

def operation(value)
  sheller = Shellany::Sheller.new(value['command'], *value['args'])
  sheller.run
  { 'stdout' => sheller.stdout.force_encoding('UTF-8'), 'status' => sheller.status.exitstatus }
end
