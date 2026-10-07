from wcmatch import glob

FLAGS = glob.GLOBSTAR | glob.BRACE

def operation(value):
    match = glob.compile(value['pattern'], flags=FLAGS).match
    return [match(p) for p in value['paths']]
