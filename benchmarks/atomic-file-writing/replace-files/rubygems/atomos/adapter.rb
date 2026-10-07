require 'atomos'

def operation(input)
  input['files'].each { |file| Atomos.atomic_write(file['path'], tmpdir: File.dirname(file['path'])) { |f| f.write(file['content']) } }
  nil
end
