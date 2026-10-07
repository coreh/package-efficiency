require 'tempfile'
require 'tmpdir'
require 'fileutils'

PAYLOAD = (0...1024).map { |i| (i * 7 + 3) & 255 }.pack('C*')

def operation(input)
  root = input['root']
  files = Array.new(input['files']) { Tempfile.new([input['filePrefix'], input['fileSuffix']], root) }
  files.each do |f|
    f.binmode
    f.write(PAYLOAD)
  end
  dirs = Array.new(input['dirs']) { Dir.mktmpdir(input['dirPrefix'], root) }
  names = files.map(&:path) + dirs
  files.each(&:close!)
  dirs.each { |d| FileUtils.remove_entry(d) }
  names
end
