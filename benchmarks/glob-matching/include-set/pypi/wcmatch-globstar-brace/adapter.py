from wcmatch import glob

FLAGS = glob.GLOBSTAR | glob.BRACE
MATCHER = glob.compile(['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml'], flags=FLAGS)

def operation(value):
    match = MATCHER.match
    return [match(p) for p in value['paths']]
