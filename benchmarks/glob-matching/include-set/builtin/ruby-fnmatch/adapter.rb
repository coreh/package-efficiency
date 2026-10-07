FLAGS = File::FNM_PATHNAME | File::FNM_EXTGLOB
PATTERNS = ['src/**/*.{ts,tsx}', '**/*.test.js', 'docs/**/*.md', 'packages/*/src/**/*.ts', '*.json', 'assets/img/*.{png,jpg,svg}', '**/__tests__/**/*', 'lib/**/index.js', '**/file-?.txt', 'config/[a-c]*.yml'].freeze
def operation(value)
  value['paths'].map { |p| PATTERNS.any? { |pat| File.fnmatch?(pat, p, FLAGS) } }
end
