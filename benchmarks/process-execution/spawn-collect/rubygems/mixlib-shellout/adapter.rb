require 'mixlib/shellout'

def operation(value)
  cmd = Mixlib::ShellOut.new(value['command'], *value['args'])
  cmd.run_command
  { 'stdout' => cmd.stdout.force_encoding('UTF-8'), 'status' => cmd.exitstatus }
end
