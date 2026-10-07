require 'pathname'
def operation(value)
  Pathname.new(value[1]).relative_path_from(Pathname.new(value[0])).to_s
end
