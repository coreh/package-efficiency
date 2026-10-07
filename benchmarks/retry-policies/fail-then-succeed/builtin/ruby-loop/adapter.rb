def operation(value)
  attempts = value['attempts']
  value['items'].map do |item|
    failures = Integer(item['failures'])
    v = Integer(item['value'])
    calls = 0
    out = 0
    done = 0
    attempts.times do
      calls += 1
      begin
        raise 'failed' if calls <= failures
        out = v * 2 + 1
        done = 1
        break
      rescue StandardError
        next
      end
    end
    { 'attempts' => calls, 'value' => (done == 1 ? out : nil) }
  end
end
