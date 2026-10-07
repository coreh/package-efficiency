require 'ruby-progressbar'

# An in-memory TTY-like stream: only the last non-blank write is remembered.
class Sink
  def last
    @last ||= ''
  end

  def tty?
    true
  end

  def write(s)
    @last = s if s.match?(/\S/)
    s.length
  end

  def print(s)
    write(s)
  end

  def flush; end
end

def operation(value)
  sink = Sink.new
  bar = ProgressBar.create(total: value['total'], output: sink, throttle_rate: 0, length: 80)
  value['steps'].times { bar.increment }
  sink.last
end
