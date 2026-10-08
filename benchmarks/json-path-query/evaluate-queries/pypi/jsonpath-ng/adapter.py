from jsonpath_ng.ext import parse

def operation(value):
    return [match.value for match in parse(value['query']).find(value['document'])]
