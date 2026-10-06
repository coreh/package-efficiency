gem 'json', '= 2.18.0'
require 'json'
require 'objspace'
def memory
  3.times { GC.start(full_mark: true, immediate_sweep: true); sleep 0.025 }
  {heapUsed: ObjectSpace.memsize_of_all}
end
def send_phase(phase, **fields)
  puts '@@' + JSON.generate({phase: phase, **fields})
  STDOUT.flush
end
send_phase('boot', pid: Process.pid, memory: memory)
server = nil
unless ARGV[0] == '-'
  Gem.use_paths(ARGV[1], [ARGV[1], *Gem.default_path])
  start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  require File.expand_path(ARGV[0])
  send_phase('loaded', importMs: (Process.clock_gettime(Process::CLOCK_MONOTONIC)-start)*1000, memory: memory)
  # Puma's own defaults unless a variant sets BENCH_THREADS.
  threads = ENV['BENCH_THREADS']
  server = Puma::Server.new(application, nil, threads ? {min_threads: 0, max_threads: threads.to_i} : {})
  server.add_tcp_listener('127.0.0.1', 0)
  port = server.binder.ios.first.addr[1]
  server.run
  send_phase('ready', port: port, memory: memory)
else
  send_phase('ready', memory: memory)
end
STDIN.each_line do |line|
  break if line.strip == 'exit'
  send_phase('settled', memory: memory) if line.strip == 'settle'
end
server&.stop(true)
