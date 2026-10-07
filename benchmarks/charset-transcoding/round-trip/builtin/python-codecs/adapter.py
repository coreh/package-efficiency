def operation(value):
    encoding = value['encoding']
    data = value['text'].encode(encoding)
    return [len(data), data.decode(encoding)]
