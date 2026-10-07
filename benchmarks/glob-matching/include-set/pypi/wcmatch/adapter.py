import os
from wcmatch import glob

# As installed: no flags. The variant sets GLOBSTAR | BRACE.
FLAGS = glob.GLOBSTAR | glob.BRACE if os.environ.get('BENCH_WCMATCH') == 'globstar-brace' else 0
MATCHER = glob.compile(['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml'], FLAGS)

def operation(value):
    match = MATCHER.match
    return [match(p) for p in value['paths']]
