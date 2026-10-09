require 'rufus-scheduler'

def operation(value)
  line = Rufus::Scheduler.parse_cron(value['pattern'])
  t = Time.at(value['start'] / 1000.0).utc
  Array.new(value['count']) { t = line.next_time(t) }
end

def describe(result)
  result.map { |t| (t.to_f * 1000).round }
end
