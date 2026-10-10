require 'minitar'

def operation(input)
  File.open(input['archive'], 'wb') do |file|
    Dir.chdir(input['source']) { Minitar.pack('.', file) }
  end
  Minitar.unpack(input['archive'], input['target'])
end
