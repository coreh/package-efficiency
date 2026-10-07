require 'console'
require 'stringio'

SINK = StringIO.new
LOGGER = Console::Logger.new(Console::Output::Serialized.new(SINK), level: Console::Logger::INFO)

def operation(doc)
  doc['records'].each do |r|
    fields = r['fields'].transform_keys(&:to_sym)
    case r['level']
    when 'info' then LOGGER.info('bench', r['message'], **fields)
    when 'warn' then LOGGER.warn('bench', r['message'], **fields)
    else LOGGER.error('bench', r['message'], **fields)
    end
  end
  out = SINK.string.dup
  SINK.truncate(0)
  SINK.rewind
  out
end
