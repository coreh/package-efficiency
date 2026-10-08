from jsonpath import JSONPath

def operation(value):
    return JSONPath(value['query']).parse(value['document'])
