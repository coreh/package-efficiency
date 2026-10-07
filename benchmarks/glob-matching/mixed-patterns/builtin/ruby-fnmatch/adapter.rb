FLAGS = File::FNM_PATHNAME | File::FNM_EXTGLOB
def operation(value)
  pattern = value['pattern']
  value['paths'].map { |p| File.fnmatch?(pattern, p, FLAGS) }
end
