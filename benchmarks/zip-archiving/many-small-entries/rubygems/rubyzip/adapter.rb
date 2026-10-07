require 'zip'
require 'stringio'

def operation(entries)
  buffer = Zip::OutputStream.write_buffer(StringIO.new) do |out|
    entries.each do |entry|
      out.put_next_entry(entry['name'])
      out.write(entry['text'])
    end
  end
  bytes = buffer.string
  extracted = []
  Zip::InputStream.open(StringIO.new(bytes)) do |input|
    while (entry = input.get_next_entry)
      extracted << { 'name' => entry.name.dup.force_encoding('UTF-8'), 'text' => input.read.to_s.dup.force_encoding('UTF-8') }
    end
  end
  [extracted, bytes.bytesize]
end

def describe(result)
  { 'entries' => result[0], 'archiveBytes' => result[1] }
end
