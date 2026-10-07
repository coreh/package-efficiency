require 'logging'
require 'stringio'

SINK = StringIO.new
LOGGER = Logging.logger['bench']
LOGGER.level = :info
LOGGER.add_appenders(Logging.appenders.io('sink', SINK, layout: Logging.layouts.json(items: %w[timestamp level logger message mdc])))

def operation(doc)
  doc['records'].each do |r|
    Logging.mdc.update(r['fields'])
    case r['level']
    when 'info' then LOGGER.info(r['message'])
    when 'warn' then LOGGER.warn(r['message'])
    else LOGGER.error(r['message'])
    end
  end
  out = SINK.string.dup
  SINK.truncate(0)
  SINK.rewind
  out
end
