import glob

def operation(input):
    root = input['root']
    return [glob.glob(pattern, root_dir=root, recursive=True) for pattern in input['patterns']]
