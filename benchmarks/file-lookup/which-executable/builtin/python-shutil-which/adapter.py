import shutil

def operation(input):
    path = input['path']
    return [shutil.which(name, path=path) for name in input['commands']]
