import jsonpath

def operation(value):
    return jsonpath.findall(value['query'], value['document'])
