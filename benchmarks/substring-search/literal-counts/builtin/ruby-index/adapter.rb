def operation(value)
  text = value["text"]
  value["needles"].map do |n|
    count = 0
    i = text.index(n)
    while i
      count += 1
      i = text.index(n, i + n.length)
    end
    count
  end
end
