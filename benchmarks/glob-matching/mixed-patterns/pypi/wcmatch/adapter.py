import os
from wcmatch import glob

# As installed: no flags. The variant sets GLOBSTAR | BRACE.
FLAGS = glob.GLOBSTAR | glob.BRACE if os.environ.get('BENCH_WCMATCH') == 'globstar-brace' else 0

def operation(value):
    match = glob.compile(value['pattern'], FLAGS).match
    return [match(p) for p in value['paths']]
