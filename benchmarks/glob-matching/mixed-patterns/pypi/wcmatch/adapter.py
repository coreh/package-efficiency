from wcmatch import glob

FLAGS = 0  # as installed

def operation(value):
    match = glob.compile(value['pattern'], flags=FLAGS).match
    return [match(p) for p in value['paths']]
