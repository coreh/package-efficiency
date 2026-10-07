require 'json'
require 'logger'
require 'stringio'

SINK = StringIO.new
LOGGER = Logger.new(SINK, level: Logger::INFO)
LOGGER.formatter = proc do |severity, time, _progname, entry|
  JSON.generate({ level: severity.downcase, time: time.to_f }.merge(entry)) << "\n"
end

def operation(doc)
  doc['records'].each do |r|
    entry = { message: r['message'] }.merge!(r['fields'])
    case r['level']
    when 'info' then LOGGER.info(entry)
    when 'warn' then LOGGER.warn(entry)
    else LOGGER.error(entry)
    end
  end
  out = SINK.string.dup
  SINK.truncate(0)
  SINK.rewind
  out
end
