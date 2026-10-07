# In-process half of a client task for Ruby. The supervisor
# (harness/client.mjs) has already started the peer; the file named by
# BENCH_CLIENT_TASK says where it listens, what the task fixes and the fixture
# inputs. See "Client tasks" in benchmarks/README.md.
#
# An adapter defines:
#   connect(host, port)       once per lane, before anything is measured;
#                             returns that lane's own state (a connection).
#   operation(state, input)   one exchange with the peer on that state; returns
#                             what the library gives back.
#   describe(result)          optional; the result as plain JSON for the verifier.
#
# A round of `count` exchanges runs on `concurrency` lanes, one thread each:
# lane w performs exchanges w, w + lanes, w + 2*lanes, ... one after another,
# and exchange k uses fixture k mod fixtures. CPU time is the whole process's.
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

def cpu
  Process.clock_gettime(Process::CLOCK_PROCESS_CPUTIME_ID)
end

def wall
  Process.clock_gettime(Process::CLOCK_MONOTONIC)
end

Thread.abort_on_exception = true
send_phase('boot', pid: Process.pid, memory: memory)
start, before = wall, cpu
require File.expand_path(ARGV[0])
elapsed, used = (wall-start)*1000, (cpu-before)*1000
send_phase('loaded', importMs: elapsed, importCpuMs: used, memory: memory)
task = JSON.parse(File.read(ENV.fetch('BENCH_CLIENT_TASK')))
inputs = task['cases'].map { |c| c['input'] }
lanes = task['concurrency']
states = [connect(task['host'], task['port'])]
# One exchange per fixture, in order; the supervisor compares what came back
# with the task's expected results and with what the peer recorded.
described = respond_to?(:describe, true)
send_phase('verification', outputs: inputs.map { |input| output = operation(states[0], input); described ? describe(output) : output })
exit 1 unless STDIN.gets&.strip == 'verified'
states << connect(task['host'], task['port']) while states.length < lanes
send_phase('ready', memory: memory)
STDIN.each_line do |line|
  line = line.strip
  break if line == 'exit'
  if line == 'settle'
    send_phase('settled', memory: memory)
    next
  end
  count = JSON.parse(line)['count']
  before, start = cpu, wall
  threads = lanes.times.map do |lane|
    Thread.new(states[lane]) do |state|
      checksum = 0
      k = lane
      while k < count
        output = operation(state, inputs[k % inputs.length])
        value = case output
                when true then 1
                when false, nil then 0
                when String then output.bytesize
                when Array, Hash then output.size
                else 1
                end
        checksum = (checksum + value) & 0xffffffff
        k += lanes
      end
      checksum
    end
  end
  checksum = threads.sum(&:value) & 0xffffffff
  elapsed, used = (wall-start)*1000, (cpu-before)*1000
  send_phase('round', requests: count, checksum: checksum, wallMs: elapsed, cpuMs: used)
end
