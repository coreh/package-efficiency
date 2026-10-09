require 'retriable'

def operation(value)
  attempts = value['attempts']
  value['items'].map do |item|
    failures = Integer(item['failures'])
    v = Integer(item['value'])
    calls = 0
    out = nil
    begin
      out = Retriable.retriable(tries: attempts, base_interval: 0, multiplier: 1, rand_factor: 0, sleep_disabled: true) do
        calls += 1
        raise 'failed' if calls <= failures
        v * 2 + 1
      end
    rescue StandardError
      out = nil
    end
    { 'attempts' => calls, 'value' => out }
  end
end
