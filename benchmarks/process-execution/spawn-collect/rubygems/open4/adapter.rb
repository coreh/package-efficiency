require 'open4'

def operation(value)
  stdout = nil
  status = Open4.popen4(value['command'], *value['args']) do |_pid, stdin, out, err|
    stdin.close
    stdout = out.read
    err.read
  end
  { 'stdout' => stdout.force_encoding('UTF-8'), 'status' => status.exitstatus }
end
