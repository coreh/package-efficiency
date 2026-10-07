require 'minitar'
require 'stringio'

def operation(entries)
  io = StringIO.new
  Minitar::Output.open(io) do |out|
    entries.each do |entry|
      text = entry['text']
      out.tar.add_file_simple(entry['name'], mode: 0o644, mtime: 0, size: text.bytesize) { |file| file.write(text) }
    end
  end
  bytes = io.string
  extracted = []
  Minitar::Reader.open(StringIO.new(bytes)) do |reader|
    reader.each_entry do |entry|
      extracted << { 'name' => entry.full_name.dup.force_encoding('UTF-8'), 'text' => entry.read.to_s.dup.force_encoding('UTF-8') }
    end
  end
  [extracted, bytes.bytesize]
end

def describe(result)
  { 'entries' => result[0], 'archiveBytes' => result[1] }
end
