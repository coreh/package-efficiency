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

send_phase('boot', pid: Process.pid, memory: memory)
unless ARGV[0] == '-'
  start, before = wall, cpu
  require File.expand_path(ARGV[0])
  elapsed, used = (wall-start)*1000, (cpu-before)*1000
  send_phase('loaded', importMs: elapsed, importCpuMs: used, memory: memory)
  inputs = JSON.parse(File.read(ARGV[1]))['cases'].map { |c| c['input'] }
  # An adapter may define prepare(input): it runs once per fixture, outside
  # measured work, to turn the fixture's JSON into what the library takes.
  inputs = inputs.map { |input| prepare(input) } if respond_to?(:prepare, true)
  # The verifier needs JSON. An adapter whose result is not plain JSON data
  # defines describe(output); it runs here, before any measured work.
  described = respond_to?(:describe, true)
  send_phase('verification', outputs: inputs.map { |input| output = operation(input); described ? describe(output) : output })
  exit 1 unless STDIN.gets&.strip == 'verified'
end
send_phase('ready', memory: memory)
STDIN.each_line do |line|
  line = line.strip
  break if line == 'exit'
  if line == 'settle'
    send_phase('settled', memory: memory)
    next
  end
  command = JSON.parse(line)
  count, minimum = command['count'], command.fetch('minMs', 0)/1000.0
  operations = checksum = 0
  before, start = cpu, wall
  loop do
    count.times do |i|
      output = operation(inputs[(operations+i)%inputs.length])
      # Strings and booleans as before; a structured result counts its length.
      value = case output
              when true then 1
              when false, nil then 0
              when String then output.bytesize
              when Array, Hash then output.size
              else 1
              end
      checksum = (checksum + value) & 0xffffffff
    end
    operations += count
    break if wall-start >= minimum
  end
  elapsed, used = (wall-start)*1000, (cpu-before)*1000
  send_phase('round', operations: operations, checksum: checksum, wallMs: elapsed, cpuMs: used)
end
