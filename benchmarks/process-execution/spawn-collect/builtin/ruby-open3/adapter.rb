require 'open3'

def operation(value)
  # The [path, argv0] form never goes through a shell, even with no arguments.
  stdout, status = Open3.capture2([value['command'], value['command']], *value['args'])
  { 'stdout' => stdout.force_encoding('UTF-8'), 'status' => status.exitstatus }
end
