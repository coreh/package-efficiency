def operation(value)
  encoding = value['encoding']
  data = value['text'].encode(encoding)
  [data.bytesize, data.encode('UTF-8')]
end
