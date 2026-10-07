from wcmatch import glob

def operation(input):
    root = input['root']
    return [glob.glob(pattern, root_dir=root) for pattern in input['patterns']]
