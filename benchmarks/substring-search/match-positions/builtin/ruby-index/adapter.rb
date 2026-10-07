def operation(value)
  text = value["text"]
  needle = value["needle"]
  out = []
  i = text.index(needle)
  while i
    out << i
    i = text.index(needle, i + needle.length)
  end
  out
end
