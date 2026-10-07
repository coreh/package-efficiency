from wcmatch import glob

def operation(input):
    root = input['root']
    return [glob.glob(pattern, flags=glob.GLOBSTAR, root_dir=root) for pattern in input['patterns']]
