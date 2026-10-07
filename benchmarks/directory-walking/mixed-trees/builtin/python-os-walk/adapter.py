import os

def operation(input):
    paths = []
    join = os.path.join
    for directory, subdirectories, files in os.walk(input['root']):
        for name in subdirectories:
            paths.append(join(directory, name))
        for name in files:
            paths.append(join(directory, name))
    return paths
