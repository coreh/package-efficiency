require 'fileutils'

def operation(input)
  FileUtils.cp_r(input['from'], input['to'])
  nil
end
