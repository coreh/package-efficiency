from deepdiff import DeepDiff
def operation(value):
    return not DeepDiff(value[0], value[1])
